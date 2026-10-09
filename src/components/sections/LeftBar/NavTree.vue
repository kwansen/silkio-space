<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useEditorViewStore } from "@/stores/editorView";
import { useNavTreeStore } from "@/stores/navTree";
import { useNavTree, type DragPayload, type DropZone } from "@/composables/useNavTree";
import { useFolderSvc } from "@/services/folder.ts";
import { useDocSvc } from "@/services/document.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";
import { docTypeIcons, type DocTypeIconKey } from "@/icons";
import type { Folder } from "@/infrastructure/db/folder.ts";
import type { Doc } from "@/infrastructure/db/document.ts";

// NavTree：导航树容器（递归组件），展示指定容器下的子文件夹与文档，并处理全部拖拽命中
defineOptions({ name: "NavTree" });

interface Props {
  // 容器 id：根容器为当前归档 id，子容器为文件夹 id
  containerId: string;
}

interface Emits {
  // 加载完成后上报当前容器是否为空（仅根容器关注）
  onEmptyChange: [empty: boolean];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const store = useEditorViewStore();
const navTreeStore = useNavTreeStore();
const { setDoc, setKey } = store;
const { dragging, indicator, startDrag, endDrag, setIndicator, clearIndicator, scheduleExpand, cancelExpand, isSelfOrDescendant, handleDrop } = useNavTree();

// 元函数：按文档类型取图标，未识别类型回退为普通文件图标
const iconFor = (d: Doc) =>
  docTypeIcons[d.doc_type as DocTypeIconKey] ?? "mdi:file-outline";

// 当前容器的子级：子文件夹在前（文档树惯例），文档在后
const folders = ref<Folder[]>([]);
const docs = ref<Doc[]>([]);

// 元函数：加载当前容器的子级
const load = async () => {
  try {
    const svc = await useFolderSvc();
    folders.value = await svc.getChildren(props.containerId);
    docs.value = await svc.getDocs(props.containerId);
  } catch (e) {
    console.error(e);
  }
};

// 元函数：容器变化或树版本变化（本地增删/移动）时重载
watch(
  () => [props.containerId, navTreeStore.version],
  () => load(),
  { immediate: true },
);

// 元函数：加载完成后向父级上报空状态（递归时逐级冒泡至根组件）
watch(
  () => [folders.value.length, docs.value.length],
  () => emit("onEmptyChange", folders.value.length === 0 && docs.value.length === 0),
);

// 元函数：编辑当前容器内文档标题时同步列表对应项
watch(
  () => [store.doc?.id, store.doc?.title],
  ([id, title]) => {
    if (!id) return;
    const item = docs.value.find((d) => d.id === id);
    if (item) item.title = title ?? "";
  },
);

// 元函数：点击文档打开（更新浏览时间、通知 main 刷新列表）
const openDoc = async (id: string) => {
  try {
    const svc = await useDocSvc();
    await svc.update(id, { viewed_at: Date.now() });
    const doc = await svc.getById(id);
    setDoc(doc);
    setKey(Date.now());
    await notifyMainRefresh();
  } catch (e) {
    console.error(e);
  }
};

// 元函数：点击文件夹行：选中并切换展开
const onFolderClick = (folder: Folder) => {
  navTreeStore.setSelectedFolder(folder.id);
  navTreeStore.toggleExpanded(folder.id);
};

// 元函数：拖拽开始（文件夹）：快照载荷，后代 id 异步补齐用于环检测
const onFolderDragStart = (e: DragEvent, folder: Folder) => {
  e.dataTransfer?.setData("text/plain", folder.name);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  const payload: DragPayload = {
    kind: "folder",
    id: folder.id,
    sourceContainerId: props.containerId,
    descendantIds: [],
  };
  startDrag(payload);
  useFolderSvc()
    .then((svc) => svc.getDescendantIds(folder.id))
    .then((ids) => {
      payload.descendantIds = ids;
    })
    .catch(() => {});
};

// 元函数：拖拽开始（文档）
const onDocDragStart = (e: DragEvent, doc: Doc) => {
  e.dataTransfer?.setData("text/plain", doc.title ?? "");
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  startDrag({
    kind: "doc",
    id: doc.id,
    sourceContainerId: props.containerId,
    descendantIds: [],
  });
};

// 元函数：按指针在行内的纵向位置计算命中区（文件夹行上下 25% 为行前/行后，中间为放入）
const zoneFromEvent = (e: DragEvent) => {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const ratio = (e.clientY - rect.top) / rect.height;
  return ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "into";
};

// 元函数：文件夹行 dragover：文档拖拽仅可放入（into），文件夹拖拽支持行前/行后/放入
const onFolderDragOver = (e: DragEvent, folder: Folder) => {
  const d = dragging.value;
  if (!d) return;
  if (d.kind === "folder" && isSelfOrDescendant(folder.id)) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  const zone: DropZone = d.kind === "doc" ? "into" : zoneFromEvent(e);
  setIndicator({ containerId: props.containerId, kind: d.kind, id: folder.id, zone });
  if (zone === "into" && !navTreeStore.expandedIds.has(folder.id)) {
    scheduleExpand(folder.id);
  } else {
    cancelExpand();
  }
};

// 元函数：文档行 dragover：仅文档拖拽可命中，按上下半区计算行前/行后
const onDocDragOver = (e: DragEvent, doc: Doc) => {
  const d = dragging.value;
  if (!d || d.kind !== "doc" || d.id === doc.id) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const zone: DropZone =
    (e.clientY - rect.top) / rect.height < 0.5 ? "before" : "after";
  setIndicator({ containerId: props.containerId, kind: d.kind, id: doc.id, zone });
  cancelExpand();
};

// 元函数：行 dragleave：仅指针真正离开该行时清除指示与自动展开
const onRowDragLeave = (e: DragEvent, id: string) => {
  const row = e.currentTarget as HTMLElement;
  if (e.relatedTarget && row.contains(e.relatedTarget as Node)) return;
  const ind = indicator.value;
  if (ind && ind.id === id) clearIndicator();
  cancelExpand();
};

// 元函数：行 drop：按当前指示落库
const onRowDrop = (e: DragEvent) => {
  e.preventDefault();
  cancelExpand();
  handleDrop();
};

// 元函数：容器空白区 dragover：仅指针悬停空白区自身时命中（追加到容器末尾）
const onContainerDragOver = (e: DragEvent) => {
  const d = dragging.value;
  if (!d || e.target !== e.currentTarget) return;
  if (d.kind === "folder" && isSelfOrDescendant(props.containerId)) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  setIndicator({ containerId: props.containerId, kind: d.kind, id: "", zone: "into" });
  cancelExpand();
};

// 元函数：容器空白区 dragleave：离开容器时清除空白区指示
const onContainerDragLeave = (e: DragEvent) => {
  const container = e.currentTarget as HTMLElement;
  if (e.relatedTarget && container.contains(e.relatedTarget as Node)) return;
  const ind = indicator.value;
  if (ind && ind.containerId === props.containerId && ind.id === "") clearIndicator();
};

// 元函数：容器空白区 drop
const onContainerDrop = (e: DragEvent) => {
  if (e.target !== e.currentTarget) return;
  e.preventDefault();
  cancelExpand();
  handleDrop();
};

// 元函数：行指示样式：放入高亮 / 行前行后插入线
const rowZone = (id: string): DropZone | null => {
  const ind = indicator.value;
  if (!ind || ind.containerId !== props.containerId || ind.id !== id) return null;
  return ind.zone;
};

// 元函数：容器空白区是否命中（渲染追加提示底色）
const containerActive = () => {
  const ind = indicator.value;
  return !!ind && ind.containerId === props.containerId && ind.id === "";
};
</script>

<template>
  <!-- 树容器：子文件夹在前、文档在后，空白区可作为"追加到末尾"的放置目标 -->
  <div
    class="min-h-2 pb-1 rounded-md"
    :class="containerActive() ? 'bg-purple-50/70' : ''"
    @dragover="onContainerDragOver"
    @dragleave="onContainerDragLeave"
    @drop="onContainerDrop"
  >
    <!-- 子文件夹 -->
    <div v-for="folder in folders" :key="folder.id" class="select-none">
      <div
        class="h-8 mt-0.5 flex items-center gap-1 px-1.5 rounded-md cursor-pointer shrink-0 group border-transparent"
        :class="[
          navTreeStore.selectedFolderId === folder.id
            ? 'bg-gray-100 text-neutral-700'
            : 'text-neutral-600 hover:bg-gray-100',
          rowZone(folder.id) === 'into' ? 'bg-purple-100 hover:bg-purple-100' : '',
          rowZone(folder.id) === 'before' ? 'border-t-2 border-purple-400' : '',
          rowZone(folder.id) === 'after' ? 'border-b-2 border-purple-400' : '',
        ]"
        draggable="true"
        @click="onFolderClick(folder)"
        @dragstart="onFolderDragStart($event, folder)"
        @dragend="endDrag"
        @dragover="onFolderDragOver($event, folder)"
        @dragleave="onRowDragLeave($event, folder.id)"
        @drop="onRowDrop"
      >
        <Icon
          :icon="navTreeStore.expandedIds.has(folder.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'"
          class="w-4 h-4 shrink-0 text-neutral-400"
        />
        <Icon
          :icon="docTypeIcons.folder"
          class="w-4 h-4 shrink-0"
          :class="navTreeStore.selectedFolderId === folder.id ? 'text-purple-600' : 'text-neutral-400'"
        />
        <div class="truncate flex-1">{{ folder.name }}</div>
        <Icon
          icon="mdi:pencil-outline"
          class="w-4 h-4 shrink-0 text-neutral-400 hover:text-purple-600 opacity-0 group-hover:opacity-100"
          @click.stop="navTreeStore.renameTarget = folder"
        />
        <Icon
          icon="mdi:delete-outline"
          class="w-4 h-4 shrink-0 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
          @click.stop="navTreeStore.removeFolderTarget = folder"
        />
      </div>
      <!-- 子容器：随展开状态渲染，整体左移一级缩进（子级无需监听空状态上报） -->
      <div v-if="navTreeStore.expandedIds.has(folder.id)" class="ml-4">
        <NavTree :container-id="folder.id" />
      </div>
    </div>
    <!-- 文档 -->
    <div
      v-for="doc in docs"
      :key="doc.id"
      class="h-8 mt-0.5 flex items-center gap-2 px-2 rounded-md cursor-pointer select-none shrink-0 group border-transparent"
      :class="[
        doc.id === store.doc?.id
          ? 'bg-gray-100 text-neutral-700'
          : 'text-neutral-600 hover:bg-gray-100',
        rowZone(doc.id) === 'before' ? 'border-t-2 border-purple-400' : '',
        rowZone(doc.id) === 'after' ? 'border-b-2 border-purple-400' : '',
      ]"
      draggable="true"
      @click="openDoc(doc.id)"
      @dragstart="onDocDragStart($event, doc)"
      @dragend="endDrag"
      @dragover="onDocDragOver($event, doc)"
      @dragleave="onRowDragLeave($event, doc.id)"
      @drop="onRowDrop"
    >
      <Icon
        :icon="iconFor(doc)"
        class="w-4 h-4 shrink-0"
        :class="doc.id === store.doc?.id ? 'text-purple-600' : 'text-neutral-400'"
      />
      <div class="truncate flex-1">{{ doc.title || "未命名标题" }}</div>
      <Icon
        icon="mdi:delete-outline"
        class="w-4 h-4 shrink-0 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
        @click.stop="navTreeStore.removeDocTarget = doc"
      />
    </div>
  </div>
</template>
