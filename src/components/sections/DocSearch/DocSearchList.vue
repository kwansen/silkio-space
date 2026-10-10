<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import { computed } from "vue";
import { useDocSearchStore } from "@/stores/docSearch";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";

export type { Item };

const docSearchStore = useDocSearchStore();

// 元函数：复用 touchDoc 更新浏览时间
const { touchDoc } = useSortDocs();

// 元函数：将当前页搜索结果转换为 DocList 列表项
const items = computed<Item[]>(() =>
  docSearchStore.pageResults.map((r) => ({
    key: r.id,
    title: r.title,
    content: r.content,
    docType: r.docType,
  })),
);

// 元函数：点击结果项时先更新 viewed_at，再通知 editor 窗口打开该文档
const handleClick = (item: Item) => {
  touchDoc(String(item.key))
    .then(() => notifyEditorOpen("doc", String(item.key)))
    .catch(console.error);
};
</script>

<template>
  <DocList :list="items" @onClick="handleClick" />
</template>
