<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed, ref } from "vue";
import { useArchiveSortStore } from "@/stores/archiveSort";
import type { FolderSortField, Folder } from "@/infrastructure/db/folder.ts";

export type { Item };

interface Emits {
  onClick: [item: Item];
}

const emit = defineEmits<Emits>();

const archiveSortStore = useArchiveSortStore();

// 各排序字段对应的 meta 展示：最近打开显示日期和时间（从未打开则不显示）；名称/自由排序无对应 meta
const metaFormatters: Partial<Record<FolderSortField, (folder: Folder) => string>> = {
  viewed_at: (folder) =>
    folder.viewed_at ? new Date(folder.viewed_at).toLocaleString() : "",
};

// 元函数：将归档列表转换为 DocList 列表项，meta 随当前排序字段联动
const items = computed<Item[]>(() =>
  archiveSortStore.folders.map((folder) => ({
    key: folder.id,
    title: folder.name,
    content: "",
    meta: metaFormatters[archiveSortStore.sortField]?.(folder),
    docType: "folder",
  })),
);

// 转发DocList的onClick事件
const handleClick = (item: Item) => {
  emit("onClick", item);
};

const popoverList = ref<PopoverItem[]>([
  {
    icon: "mdi:file-outline",
    name: "xxx",
    action: () => console.log("xxx"),
  },
]);
</script>

<template>
  <DocList :list="items" :popover-list="popoverList" @onClick="handleClick" />
</template>
