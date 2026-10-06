<script setup lang="ts">
import DocSortList, { Item } from "./DocSortList.vue";
import DocSortOption from "./DocSortOption.vue";
import DocSortPagination from "./DocSortPagination.vue";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";
import { useSortDocs } from "@/composables/useSortDocs.ts";

// 元函数：组装排序文档组合式函数
const { touchDoc } = useSortDocs();

// 元函数：点击文档项时先更新 viewed_at，再通知 editor 窗口打开该文档
// [日志]
const handleClick = (item: Item) => {
  console.log(
    `[perf] DocSort.handleClick start t=${performance.now().toFixed(0)}`,
  );
  touchDoc(String(item.key))
    .then(() => {
      console.log(`[perf] touchDoc done t=${performance.now().toFixed(0)}`);
      notifyEditorOpen("doc", String(item.key));
    })
    .catch(console.error);
};
</script>

<template>
  <div class="bg-white rounded-2xl p-4 mt-14">
    <DocSortOption />
    <DocSortList @on-click="handleClick" />
    <DocSortPagination />
  </div>
  <div class="h-14"></div>
</template>
