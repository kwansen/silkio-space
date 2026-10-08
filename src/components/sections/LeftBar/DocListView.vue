<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import draggable from "vuedraggable";
import EmptyTip from "@/components/shared/EmptyTip.vue";
import { useEditorViewStore } from "@/stores/editorView";
import { useDocSvc } from "@/services/document.ts";
import { useFolderSvc } from "@/services/folder.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";
import { docTypeIcons, type DocTypeIconKey } from "@/icons";
import type { Doc } from "@/infrastructure/db/document.ts";

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

// 元函数：归档变化时刷新文档列表
watch(
  () => store.folder?.id,
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

</script>
<template>
  <!-- 归档文档列表：按 sort_order 升序，支持拖拽排序，点击切换渲染 -->
  <div class="">
    <EmptyTip v-if="docs.length < 1" text="暂无文档" />
    <draggable
      :list="docs"
      item-key="id"
      :animation="150"
      @end="handleDragEnd"
    >
      <template #item="{ element }">
        <div
          class="h-8 rounded-md mt-0.5 flex items-center gap-2 px-2 select-none shrink-0"
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
              element.id === store.doc?.id ? 'text-purple-600' : 'text-neutral-400'
            "
          />
          <div class="truncate">{{ element.title || "未命名标题" }}</div>
        </div>
      </template>
    </draggable>
  </div>
</template>
