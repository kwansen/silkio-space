<script setup lang="ts">
import DocSearchInput from "./DocSearchInput.vue";
import DocSearchList from "./DocSearchList.vue";
import DocSearchPagination from "./DocSearchPagination.vue";
import type { Item } from "@/components/shared/DocList.vue";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import { useDocSearchStore } from "@/stores/docSearch";

const docSearchStore = useDocSearchStore();

// 元函数：组装排序文档组合式函数（复用 touchDoc 更新浏览时间）
const { touchDoc } = useSortDocs();

// 元函数：点击结果项时先更新 viewed_at，再通知 editor 窗口打开该文档
const handleClick = (item: Item) => {
  touchDoc(String(item.key))
    .then(() => notifyEditorOpen("doc", String(item.key)))
    .catch(console.error);
};
</script>

<template>
  <div class="bg-white rounded-2xl p-4">
    <DocSearchInput />
    <DocSearchList @on-click="handleClick" />
    <!-- 页码不超过 1 页时不渲染分页 -->
    <DocSearchPagination v-if="docSearchStore.pages.length > 1" />
  </div>
</template>
