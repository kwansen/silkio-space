<script setup lang="ts">
import ArchiveList, { Item } from "@/components/shared/ArchiveList.vue";
import { computed } from "vue";
import { useArchiveSortStore } from "@/stores/archiveSort";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";
import type { FolderSortField, Folder } from "@/infrastructure/db/folder.ts";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";

const archiveSortStore = useArchiveSortStore();

// 各排序字段对应的 meta 展示：最近打开显示日期和时间（从未打开则不显示）；名称/自由排序无对应 meta
const metaFormatters: Partial<
  Record<FolderSortField, (folder: Folder) => string>
> = {
  viewed_at: (folder) =>
    folder.viewed_at ? new Date(folder.viewed_at).toLocaleString() : "",
};

// 元函数：将归档列表转换为 ArchiveList 列表项，meta 随当前排序字段联动
const items = computed<Item[]>(() =>
  archiveSortStore.folders.map((folder) => ({
    key: folder.id,
    title: folder.name,
    meta: metaFormatters[archiveSortStore.sortField]?.(folder),
  })),
);

// 元函数：点击归档项时先更新其浏览时间（最近打开排序依据），再通知 editor 窗口打开该归档
const handleClick = (item: Item) => {
  touchFolder(String(item.key))
    .then(() => notifyEditorOpen("folder", String(item.key)))
    .catch(console.error);
};

// 元函数：组装归档排序组合式函数
const { touchFolder, refreshFolders, reorderFolders } = useArchiveSort();

// 仅自由排序模式下允许拖拽
const isFreeSort = computed(() => archiveSortStore.sortField === "sort_order");

// 元函数：拖拽结束后先本地调整顺序，再持久化 sort_order（失败时回滚为数据库顺序）
const handleDragEnd = async (oldIndex: number, newIndex: number) => {
  archiveSortStore.moveFolder(oldIndex, newIndex);
  try {
    await reorderFolders();
  } catch (e) {
    console.error(e);
    await refreshFolders();
  }
};
</script>

<template>
  <ArchiveList
    :list="items"
    :draggable="isFreeSort"
    @onClick="handleClick"
    @onDragEnd="handleDragEnd"
  />
</template>
