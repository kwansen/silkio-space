<script setup lang="ts">
import ArchiveList, { Item } from "@/components/shared/ArchiveList.vue";
import { computed } from "vue";
import { useArchiveSearchStore } from "@/stores/archiveSearch";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";

const archiveSearchStore = useArchiveSearchStore();

// 元函数：将命中归档转换为 ArchiveList 列表项（仅展示名称）
const items = computed<Item[]>(() =>
  archiveSearchStore.archives.map((folder) => ({
    key: folder.id,
    title: folder.name,
  })),
);

// 元函数：组装归档排序组合式函数（复用 touchFolder 更新浏览时间）
const { touchFolder } = useArchiveSort();

// 元函数：点击结果项时先更新 viewed_at，再通知 editor 窗口打开该归档
const handleClick = (item: Item) => {
  touchFolder(String(item.key))
    .then(() => notifyEditorOpen("folder", String(item.key)))
    .catch(console.error);
};
</script>

<template>
  <ArchiveList :list="items" @onClick="handleClick" />
</template>
