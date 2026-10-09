<script setup lang="ts">
import ArchiveSearchInput from "./ArchiveSearchInput.vue";
import ArchiveSearchList from "./ArchiveSearchList.vue";
import type { Item } from "@/components/shared/DocList.vue";
import { onMounted } from "vue";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";
import { useArchiveSearch } from "@/composables/useArchiveSearch.ts";

// 元函数：组装归档搜索组合式函数
const { refreshFolders } = useArchiveSearch();

// 元函数：组装归档排序组合式函数（复用 touchFolder 更新浏览时间）
const { touchFolder } = useArchiveSort();

// 挂载时加载归档并重建标题倒排索引
onMounted(() => refreshFolders().catch(console.error));

// 元函数：点击结果项时先更新 viewed_at，再通知 editor 窗口打开该归档
const handleClick = (item: Item) => {
  touchFolder(String(item.key))
    .then(() => notifyEditorOpen("folder", String(item.key)))
    .catch(console.error);
};
</script>

<template>
  <div class="bg-white rounded-2xl p-4">
    <ArchiveSearchInput />
    <ArchiveSearchList @on-click="handleClick" />
  </div>
</template>
