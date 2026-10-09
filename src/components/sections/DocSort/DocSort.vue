<script setup lang="ts">
import DocSortList, { Item } from "./DocSortList.vue";
import DocSortOption from "./DocSortOption.vue";
import DocSortPagination from "./DocSortPagination.vue";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import { useSortDocStore } from "@/stores/sortDoc";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";

const sortDocStore = useSortDocStore();

// 元函数：组装排序文档组合式函数
const { touchDoc } = useSortDocs();

// 元函数：点击文档项时先更新 viewed_at，再通知 editor 窗口打开该文档
// [日志]
const handleClick = (item: Item) => {
  touchDoc(String(item.key))
    .then(() => notifyEditorOpen("doc", String(item.key)))
    .catch(console.error);
};
</script>

<template>
  <div class="bg-white rounded-2xl p-4">
    <DocSortOption />
    <DocSortList @on-click="handleClick" />
    <!-- 页码不超过 1 页时不渲染分页 -->
    <DocSortPagination v-if="sortDocStore.pages.length > 1" />
  </div>
</template>
