<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import draggable from "vuedraggable";
import { useEventListener } from "@vueuse/core";
import TextButton from "@/components/shared/TextButton.vue";
import { useEditorViewStore } from "@/stores/editorView";
import { useDocSvc } from "@/services/document.ts";
import { useFolderSvc } from "@/services/folder.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";
import { docTypeIcons, type DocTypeIconKey } from "@/icons";
import type { Doc } from "@/infrastructure/db/document.ts";
import NavEmpty from "./NavEmpty.vue";

const store = useEditorViewStore();
const { setDoc, setKey } = store;

// 元函数：按文档类型取图标，未识别类型回退为普通文件图标
const iconFor = (d: Doc) =>
  docTypeIcons[d.doc_type as DocTypeIconKey] ?? "mdi:file-outline";

// 元函数：加载侧栏文档列表（按归档内加入顺序 sort_order 升序，无归档时为空）
const docs = ref<Doc[]>([]);

const loadDocs = async () => {
  if (!store.folder) {
    docs.value = [];
    return;
  }
  try {
    const folderSvc = await useFolderSvc();
    docs.value = await folderSvc.getDocs(store.folder.id);
  } catch (e) {
    console.error(e);
  }
};

// 元函数：归档变化或打开/新建文档（key 变化）时刷新文档列表
watch(
  () => [store.folder?.id, store.key],
  () => loadDocs(),
  { immediate: true },
);

// 元函数：点击列表项打开文档（更新浏览时间、通知 main 刷新列表）并刷新自身列表
const openDoc = async (id: string) => {
  try {
    const svc = await useDocSvc();
    await svc.update(id, { viewed_at: Date.now() });
    const doc = await svc.getById(id);
    setDoc(doc);
    setKey(Date.now());
    notifyMainRefresh();
    await loadDocs();
  } catch (e) {
    console.error(e);
  }
};

// 元函数：拖拽结束后持久化新顺序（vuedraggable 已就地调整 docs，失败时回滚为数据库顺序）
const handleDragEnd = async () => {
  if (!store.folder) return;
  try {
    const folderSvc = await useFolderSvc();
    await folderSvc.reorderDocs(
      store.folder.id,
      docs.value.map((d) => d.id),
    );
  } catch (e) {
    console.error(e);
    await loadDocs();
  }
};

// 待删除文档：非空时渲染删除弹窗；deleteDoc 为勾选的"同时删除文档"
const removeTarget = ref<Doc | null>(null);
const deleteDoc = ref<boolean>(false);

// 元函数：打开删除弹窗（默认仅移出归档，勾选后同时永久删除文档）
const openRemove = (doc: Doc) => {
  deleteDoc.value = false;
  removeTarget.value = doc;
};

// 元函数：确认删除：默认仅移出归档；勾选后永久删除文档并通知 main 刷新列表；
// 当前展示文档被移除时切换为归档内第一个文档
const handleRemove = async () => {
  const doc = removeTarget.value;
  const folderId = store.folder?.id;
  removeTarget.value = null;
  if (!doc || !folderId) return;
  try {
    const folderSvc = await useFolderSvc();
    await folderSvc.removeDoc(folderId, doc.id);
    if (deleteDoc.value) {
      const svc = await useDocSvc();
      await svc.remove(doc.id);
      await notifyMainRefresh();
    }
    if (store.doc?.id === doc.id) {
      setDoc(await folderSvc.getFirstDoc(folderId));
      setKey(Date.now());
    }
    await loadDocs();
  } catch (e) {
    console.error(e);
  }
};

// Esc 关闭删除弹窗（仅打开时）
useEventListener(window, "keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape" && removeTarget.value) removeTarget.value = null;
});
</script>
<template>
  <!-- 归档文档列表：按 sort_order 升序，支持拖拽排序，点击切换渲染 -->
  <div>
    <NavEmpty v-if="docs.length < 1" />
    <draggable :list="docs" item-key="id" :animation="150" @end="handleDragEnd">
      <template #item="{ element }">
        <div
          class="h-8 rounded-md mt-0.5 flex items-center gap-2 px-2 select-none shrink-0 group"
          :class="
            element.id === store.doc?.id
              ? 'bg-gray-100 text-neutral-700'
              : 'text-neutral-600 hover:bg-gray-100'
          "
          @click="openDoc(element.id)"
        >
          <Icon
            :icon="iconFor(element)"
            class="w-4 h-4 shrink-0"
            :class="
              element.id === store.doc?.id
                ? 'text-purple-600'
                : 'text-neutral-400'
            "
          />
          <div class="truncate flex-1">{{ element.title || "未命名标题" }}</div>
          <Icon
            icon="mdi:delete-outline"
            class="w-4 h-4 shrink-0 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
            @click.stop="openRemove(element)"
          />
        </div>
      </template>
    </draggable>
    <!-- 删除弹窗：默认仅移出归档，可勾选同时永久删除文档 -->
    <div
      v-if="removeTarget"
      class="fixed inset-0 bg-black/30 z-50 grid place-items-center"
      @click.self="removeTarget = null"
    >
      <div class="w-80 bg-white rounded-2xl p-4 shadow-xl select-none">
        <div class="text-sm text-neutral-700 mb-2">删除</div>
        <div class="text-xs text-neutral-500 mb-3 truncate">
          将「{{ removeTarget.title || "未命名标题" }}」移出当前归档
        </div>
        <div
          class="h-8 flex items-center gap-2 px-2 rounded-md text-xs cursor-pointer hover:bg-gray-100 mb-3"
          @click="deleteDoc = !deleteDoc"
        >
          <Icon
            :icon="
              deleteDoc ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'
            "
            class="w-5 h-5"
            :class="deleteDoc ? 'text-purple-600' : 'text-neutral-300'"
          />
          <div>同时删除文档（不可恢复）</div>
        </div>
        <div class="flex justify-end gap-2">
          <TextButton
            class="h-7 px-3 text-xs rounded-md text-neutral-500 hover:bg-gray-100"
            @click="removeTarget = null"
          >
            取消
          </TextButton>
          <TextButton
            class="h-7 px-3 text-xs rounded-md text-white bg-purple-600 hover:bg-purple-500"
            @click="handleRemove"
          >
            确定
          </TextButton>
        </div>
      </div>
    </div>
  </div>
</template>
