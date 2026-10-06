<script setup lang="ts">
import ArchiveSortList, { Item } from "./ArchiveSortList.vue";
import ArchiveSortOption from "./ArchiveSortOption.vue";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";

// 元函数：组装归档排序组合式函数
const { touchFolder } = useArchiveSort();

// 元函数：点击归档项时更新其浏览时间（最近打开排序依据；后续：进入归档查看其下文档）
const handleClick = (item: Item) => {
  touchFolder(String(item.key)).catch(console.error);
};
</script>

<template>
  <div class="bg-white rounded-2xl p-4 mt-14">
    <ArchiveSortOption />
    <ArchiveSortList @on-click="handleClick" />
  </div>
  <div class="h-14"></div>
</template>
