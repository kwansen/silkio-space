<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed } from "vue";
import { useDocSortStore } from "@/stores/docSort.ts";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import { useArchivePickerStore } from "@/stores/archivePicker.ts";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";
import type { Doc, SortField } from "@/infrastructure/db/document.ts";
import DocSortEmpty from "./DocSortEmpty.vue";

export type { Item };

const docSortStore = useDocSortStore();

// 各排序字段对应的 meta 展示：时间字段显示日期和时间，字数显示数值
const metaFormatters: Record<SortField, (doc: Doc) => string> = {
  viewed_at: (doc) => new Date(doc.viewed_at).toLocaleString(),
  updated_at: (doc) => new Date(doc.updated_at).toLocaleString(),
  created_at: (doc) => new Date(doc.created_at).toLocaleString(),
  word_count: (doc) => `${doc.word_count} 字`,
};

// 元函数：将文档列表转换为 DocList 列表项，meta 随当前排序字段联动
const items = computed<Item[]>(() =>
  docSortStore.docs.map((doc) => ({
    key: doc.id,
    title: doc.title ?? "未命名标题",
    content: doc.plain_text ?? "",
    meta: metaFormatters[docSortStore.sortField](doc),
    docType: doc.doc_type,
  })),
);

// 元函数：组装排序文档组合式函数
const { removeDoc, touchDoc } = useSortDocs();

// 元函数：点击文档项时先更新 viewed_at，再通知 editor 窗口打开该文档
// [日志]
const handleClick = (item: Item) => {
  touchDoc(String(item.key))
    .then(() => notifyEditorOpen("doc", String(item.key)))
    .catch(console.error);
};

const archivePickerStore = useArchivePickerStore();

// popover 菜单：归档（唤起 App.vue 挂载的全局归档选择弹窗）与删除（key 由 DocList 注入，为当前文档 id）
const popoverList = computed<PopoverItem[]>(() => [
  {
    icon: "mdi:archive-outline",
    name: "归档",
    action: (key) => {
      if (key === null || key === undefined) return;
      archivePickerStore.open(String(key));
    },
  },
  {
    icon: "mdi:delete-outline",
    name: "删除",
    action: async (key) => {
      if (key === null || key === undefined) return;
      await removeDoc(String(key));
    },
  },
]);
</script>

<template>
  <DocList :list="items" :popover-list="popoverList" @onClick="handleClick" />
  <DocSortEmpty v-if="items.length === 0" />
</template>
