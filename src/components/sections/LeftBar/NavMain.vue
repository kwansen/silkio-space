<script setup lang="ts">
import { computed, ref, watch, type Component } from "vue";
import ArrowDown from "@/components/icons/ArrowDown.vue";
import ArrowRight from "@/components/icons/ArrowRight.vue";
import FolderIcon from "@/components/icons/Folder.vue";
import Pencil from "@/components/icons/Pencil.vue";
import Delete from "@/components/icons/Delete.vue";
import DocIcon from "@/components/icons/Doc.vue";
import MindmapIcon from "@/components/icons/Mindmap.vue";
import FlowchartIcon from "@/components/icons/Flowchart.vue";
import { useEditorViewStore } from "@/stores/editorView";
import { useNavTreeStore } from "@/stores/navTree";
import {
  useNavTree,
  type DragPayload,
  type DropZone,
} from "@/composables/useNavTree";
import { useFdSvc } from "@/services/folder.ts";
import { useDocSvc } from "@/services/document.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";
import type { Folder } from "@/infrastructure/db/folder.ts";
import type { Doc } from "@/infrastructure/db/document.ts";
import NavEmpty from "./NavEmpty.vue";
import { useArchiveRenameStore } from "@/stores/archiveRename";

defineOptions({ name: "NavMain" });

const store = useEditorViewStore();
const navTreeStore = useNavTreeStore();
const {
  dragging,
  indicator,
  startDrag,
  endDrag,
  setIndicator,
  clearIndicator,
  scheduleExpand,
  cancelExpand,
  isSelfOrDescendant,
  handleDrop,
} = useNavTree();

// 子树数据一次加载：childrenMap[容器id] = { folders, docs }
// 文件夹在前、文档在后，各自保持容器内加入顺序（VS Code 式平铺渲染的数据源）
const childrenMap = ref(new Map<string, { folders: Folder[]; docs: Doc[] }>());

// 元函数：加载当前归档整棵子树（两条查询：全部子文件夹 + 全部文档及其所属容器）
const load = async () => {
  const rootId = store.folder?.id;
  if (!rootId) {
    childrenMap.value = new Map();
    return;
  }
  try {
    const folderSvc = useFdSvc();
    const [folders, docsInContainers] = await Promise.all([
      folderSvc.getSubtreeFolders({ id: rootId }),
      folderSvc.getSubtreeDocs({ id: rootId }),
    ]);
    const map = new Map<string, { folders: Folder[]; docs: Doc[] }>();
    const ensure = (containerId: string) => {
      let c = map.get(containerId);
      if (!c) {
        c = { folders: [], docs: [] };
        map.set(containerId, c);
      }
      return c;
    };
    // 查询结果已按 sort_order 排序，分组push保持同级相对次序
    for (const f of folders) ensure(f.parent_id ?? rootId).folders.push(f);
    for (const { container_id, ...doc } of docsInContainers) {
      ensure(container_id).docs.push(doc);
    }
    childrenMap.value = map;
  } catch (e) {
    console.error(e);
  }
};

// 归档切换时重置导航选中/展开状态与弹窗目标（reset 内自增 version）
watch(
  () => store.folder?.id,
  () => navTreeStore.reset(),
);
// 树版本变化（新建/移动/删除）或归档切换时重载子树
watch(
  () => [store.folder?.id, navTreeStore.version],
  () => load(),
  { immediate: true },
);

// 可见行（状态驱动平铺）：按展开状态展开子树并计算缩进层级，单层列表渲染
interface NavFolderRow {
  kind: "folder";
  id: string;
  folder: Folder;
  // 该行所在容器（文件夹行为其父容器，即拖拽排序的目标同级）
  containerId: string;
  depth: number;
}
interface NavDocRow {
  kind: "doc";
  id: string;
  doc: Doc;
  containerId: string;
  depth: number;
}
type NavRow = NavFolderRow | NavDocRow;

const rows = computed<NavRow[]>(() => {
  const out: NavRow[] = [];
  const walk = (containerId: string, depth: number) => {
    const c = childrenMap.value.get(containerId);
    if (!c) return;
    for (const f of c.folders) {
      out.push({ kind: "folder", id: f.id, folder: f, containerId, depth });
      if (navTreeStore.expandedIds.has(f.id)) walk(f.id, depth + 1);
    }
    for (const d of c.docs) {
      out.push({ kind: "doc", id: d.id, doc: d, containerId, depth });
    }
  };
  const rootId = store.folder?.id;
  if (rootId) walk(rootId, 0);
  return out;
});

const rowsEmpty = computed(() => rows.value.length === 0);

// 元函数：行缩进（每级 16px），替代嵌套结构实现
const rowIndent = (depth: number) => ({ paddingLeft: `${8 + depth * 16}px` });

// 元函数：按文档类型取图标，未识别类型回退为普通文档图标
const iconFor = (d: Doc): Component =>
  d.doc_type === "mindMap"
    ? MindmapIcon
    : d.doc_type === "flowChart"
      ? FlowchartIcon
      : DocIcon;

// 元函数：文档行标题：编辑中的文档实时取 store 标题（状态驱动，无需手动同步列表）
const docTitle = (d: Doc) =>
  d.id === store.doc?.id
    ? store.doc?.title || "未命名标题"
    : d.title || "未命名标题";

// 元函数：点击文档打开（更新浏览时间、写入当前窗口、通知 main 刷新列表）
const openDoc = async (id: string) => {
  try {
    const svc = await useDocSvc();
    await svc.update(id, { viewed_at: Date.now() });
    store.setDoc(await svc.getById(id));
    store.setKey(Date.now());
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

// 元函数：拖拽开始（文件夹行）：快照载荷，后代 id 异步补齐用于环检测
const onFolderDragStart = (
  e: DragEvent,
  folder: Folder,
  containerId: string,
) => {
  e.dataTransfer?.setData("text/plain", folder.name);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  const payload: DragPayload = {
    kind: "folder",
    id: folder.id,
    sourceContainerId: containerId,
    descendantIds: [],
  };
  startDrag(payload);
  useFdSvc()
    .getDescendantIds({ id: folder.id })
    .then((ids) => {
      payload.descendantIds = ids;
    })
    .catch(() => {});
};

// 元函数：拖拽开始（文档行）
const onDocDragStart = (e: DragEvent, doc: Doc, containerId: string) => {
  e.dataTransfer?.setData("text/plain", doc.title ?? "");
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  startDrag({
    kind: "doc",
    id: doc.id,
    sourceContainerId: containerId,
    descendantIds: [],
  });
};

// 元函数：文件夹行 dragover：文档拖拽整行可"放入"；文件夹拖拽上下 25% 行前/行后、中间"放入"
const onFolderDragOver = (e: DragEvent, row: NavFolderRow) => {
  const d = dragging.value;
  if (!d) return;
  // 文件夹不可放入自身或其后代
  if (d.kind === "folder" && isSelfOrDescendant(row.id)) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const ratio = (e.clientY - rect.top) / rect.height;
  const zone: DropZone =
    d.kind === "doc"
      ? "into"
      : ratio < 0.25
        ? "before"
        : ratio > 0.75
          ? "after"
          : "into";
  setIndicator({
    containerId: row.containerId,
    kind: d.kind,
    id: row.id,
    zone,
  });
  // 悬停折叠文件夹 600ms 后自动展开
  if (zone === "into" && !navTreeStore.expandedIds.has(row.id)) {
    scheduleExpand(row.id);
  } else {
    cancelExpand();
  }
};

// 元函数：文档行 dragover：文档拖拽按上下半区行前/行后；文件夹拖拽语义为"移入该行所属容器末尾"
// （文件夹展示在文档之前，追加到同级文件夹末尾与"文档行之后"等价）
const onDocDragOver = (e: DragEvent, row: NavDocRow) => {
  const d = dragging.value;
  if (!d) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  if (d.kind === "doc") {
    if (d.id === row.id) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const zone: DropZone =
      (e.clientY - rect.top) / rect.height < 0.5 ? "before" : "after";
    setIndicator({
      containerId: row.containerId,
      kind: d.kind,
      id: row.id,
      zone,
    });
  } else {
    if (isSelfOrDescendant(row.containerId)) return;
    setIndicator({
      containerId: row.containerId,
      kind: d.kind,
      id: "",
      zone: "into",
      displayId: row.id,
    });
  }
  cancelExpand();
};

// 元函数：行 dragleave：指针真正离开该行时清除指示与自动展开
const onRowDragLeave = (e: DragEvent) => {
  const row = e.currentTarget as HTMLElement;
  if (e.relatedTarget && row.contains(e.relatedTarget as Node)) return;
  clearIndicator();
  cancelExpand();
};

// 元函数：行 drop：按当前指示落库
const onRowDrop = (e: DragEvent) => {
  e.preventDefault();
  cancelExpand();
  handleDrop();
};

// 元函数：根容器空白区（所有行之下）dragover：追加到归档根目录末尾
const onRootBlankDragOver = (e: DragEvent) => {
  const d = dragging.value;
  const rootId = store.folder?.id;
  if (!d || !rootId || e.target !== e.currentTarget) return;
  if (d.kind === "folder" && isSelfOrDescendant(rootId)) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  setIndicator({ containerId: rootId, kind: d.kind, id: "", zone: "into" });
  cancelExpand();
};

// 元函数：根容器空白区 dragleave：离开根容器时清除空白区指示
const onRootBlankDragLeave = (e: DragEvent) => {
  const root = e.currentTarget as HTMLElement;
  if (e.relatedTarget && root.contains(e.relatedTarget as Node)) return;
  const ind = indicator.value;
  const rootId = store.folder?.id;
  if (
    ind &&
    rootId &&
    ind.containerId === rootId &&
    ind.id === "" &&
    !ind.displayId
  ) {
    clearIndicator();
  }
};

// 元函数：根容器空白区 drop
const onRootBlankDrop = (e: DragEvent) => {
  if (e.target !== e.currentTarget) return;
  e.preventDefault();
  cancelExpand();
  handleDrop();
};

// 元函数：行命中区（displayId 优先：文件夹悬停文档行时高亮该行，落库仍指向容器）
const rowZone = (id: string): DropZone | null => {
  const ind = indicator.value;
  if (!ind) return null;
  return (ind.displayId ?? ind.id) === id ? ind.zone : null;
};

// 元函数：行"放入"高亮
const rowActive = (id: string) => rowZone(id) === "into";

// 元函数：根容器空白区高亮
const rootBlankActive = computed(() => {
  const ind = indicator.value;
  const rootId = store.folder?.id;
  return (
    !!ind &&
    !!rootId &&
    ind.containerId === rootId &&
    ind.id === "" &&
    !ind.displayId
  );
});

// 元函数：获取归档重命名弹窗 store（弹窗状态自持，实例由 App.vue 全局挂载）
const archiveRenameStore = useArchiveRenameStore();
</script>

<template>
  <!-- 导航树：VS Code 式平铺渲染，展开状态驱动可见行与缩进，支持拖拽移动与排序 -->
  <div
    class="pb-2 px-1 min-h-2 rounded-md"
    :class="rootBlankActive ? 'bg-purple-50/70' : ''"
    @dragover="onRootBlankDragOver"
    @dragleave="onRootBlankDragLeave"
    @drop="onRootBlankDrop"
  >
    <NavEmpty v-if="!store.folder || rowsEmpty" />
    <template v-else>
      <template v-for="row in rows" :key="row.kind + row.id">
        <!-- 文件夹行 -->
        <div
          v-if="row.kind === 'folder'"
          class="h-8 mt-0.5 flex items-center gap-1 pr-2 rounded-md cursor-pointer select-none group border-transparent"
          :class="[
            navTreeStore.selectedFolderId === row.id
              ? 'bg-gray-100 text-neutral-700'
              : 'text-neutral-600 hover:bg-gray-100',
            rowActive(row.id) ? 'bg-purple-100 hover:bg-purple-100' : '',
            rowZone(row.id) === 'before' ? 'border-t-2 border-purple-400' : '',
            rowZone(row.id) === 'after' ? 'border-b-2 border-purple-400' : '',
          ]"
          :style="rowIndent(row.depth)"
          draggable="true"
          @click="onFolderClick(row.folder)"
          @dragstart="onFolderDragStart($event, row.folder, row.containerId)"
          @dragend="endDrag"
          @dragover="onFolderDragOver($event, row)"
          @dragleave="onRowDragLeave"
          @drop="onRowDrop"
        >
          <ArrowDown
            v-if="navTreeStore.expandedIds.has(row.id)"
            class="w-4 h-4 shrink-0 text-neutral-400"
          />
          <ArrowRight v-else class="w-4 h-4 shrink-0 text-neutral-400" />
          <FolderIcon
            class="w-4 h-4 shrink-0"
            :class="
              navTreeStore.selectedFolderId === row.id
                ? 'text-purple-600'
                : 'text-neutral-400'
            "
          />
          <div class="truncate flex-1">{{ row.folder.name }}</div>
          <Pencil
            class="w-4 h-4 shrink-0 text-neutral-400 hover:text-purple-600 opacity-0 group-hover:opacity-100"
            @click.stop="archiveRenameStore.open(row.folder)"
          />
          <Delete
            class="w-4 h-4 shrink-0 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
            @click.stop="navTreeStore.removeFolderTarget = row.folder"
          />
        </div>
        <!-- 文档行 -->
        <div
          v-else
          class="h-8 mt-0.5 flex items-center gap-2 pr-2 rounded-md cursor-pointer select-none group border-transparent"
          :class="[
            row.doc.id === store.doc?.id
              ? 'bg-gray-100 text-neutral-700'
              : 'text-neutral-600 hover:bg-gray-100',
            rowActive(row.id) ? 'bg-purple-100 hover:bg-purple-100' : '',
            rowZone(row.id) === 'before' ? 'border-t-2 border-purple-400' : '',
            rowZone(row.id) === 'after' ? 'border-b-2 border-purple-400' : '',
          ]"
          :style="rowIndent(row.depth)"
          draggable="true"
          @click="openDoc(row.doc.id)"
          @dragstart="onDocDragStart($event, row.doc, row.containerId)"
          @dragend="endDrag"
          @dragover="onDocDragOver($event, row)"
          @dragleave="onRowDragLeave"
          @drop="onRowDrop"
        >
          <component
            :is="iconFor(row.doc)"
            class="w-4 h-4 shrink-0"
            :class="
              row.doc.id === store.doc?.id
                ? 'text-purple-600'
                : 'text-neutral-400'
            "
          />
          <div class="truncate flex-1">{{ docTitle(row.doc) }}</div>
          <Delete
            class="w-4 h-4 shrink-0 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
            @click.stop="navTreeStore.removeDocTarget = row.doc"
          />
        </div>
      </template>
    </template>
  </div>
</template>
