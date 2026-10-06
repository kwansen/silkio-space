<script setup lang="ts">
import ArchiveSortList, { Item } from "./ArchiveSortList.vue";
import ArchiveSortOption from "./ArchiveSortOption.vue";
import ArchiveSortPagination from "./ArchiveSortPagination.vue";
import { useArchiveSortStore } from "@/stores/archiveSort";

const archiveSortStore = useArchiveSortStore();

// 元函数：点击归档项（后续：进入归档查看其下文档）
const handleClick = (item: Item) => {
  console.log("archive click:", item.key);
};
</script>

<template>
  <div class="bg-white rounded-2xl p-4 mt-14">
    <ArchiveSortOption />
    <ArchiveSortList @on-click="handleClick" />
    <!-- 页码不超过 1 页时不渲染分页 -->
    <ArchiveSortPagination v-if="archiveSortStore.pages.length > 1" />
  </div>
  <div class="h-14"></div>
</template>
