<script setup lang="ts">
import ArchiveSortList, { Item } from "./ArchiveSortList.vue";
import ArchiveSortOption from "./ArchiveSortOption.vue";
import { onMounted } from "vue";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";
import ArchiveSortEmpty from "./ArchiveSortEmpty.vue";

// 元函数：组装归档排序组合式函数
const { touchFolder, refreshFolders } = useArchiveSort();

// 挂载时加载归档列表（MainView 启动时仅刷新文档，归档需自行加载）
onMounted(() => refreshFolders().catch(console.error));

// 元函数：点击归档项时先更新其浏览时间（最近打开排序依据），再通知 editor 窗口打开该归档
const handleClick = (item: Item) => {
  touchFolder(String(item.key))
    .then(() => notifyEditorOpen("folder", String(item.key)))
    .catch(console.error);
};
</script>

<template>
  <div class="bg-white rounded-2xl p-4">
    <ArchiveSortOption />
    <ArchiveSortList @on-click="handleClick" />
  </div>
</template>
