<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed, ref } from "vue";
import { useArchiveSortStore } from "@/stores/archiveSort";
import type { FolderSortField, FolderWithCount } from "@/infrastructure/db/folder.ts";

export type { Item };

interface Emits {
  onClick: [item: Item];
}

const emit = defineEmits<Emits>();

const archiveSortStore = useArchiveSortStore();

// 各排序字段对应的 meta 展示：归档仅有两种时间字段，显示日期和时间
const metaFormatters: Record<FolderSortField, (folder: FolderWithCount) => string> = {
  updated_at: (folder) => new Date(folder.updated_at).toLocaleString(),
  created_at: (folder) => new Date(folder.created_at).toLocaleString(),
};

// 元函数：将归档列表转换为 DocList 列表项，meta 随当前排序字段联动
const items = computed<Item[]>(() =>
  archiveSortStore.folders.map((folder) => ({
    key: folder.id,
    title: folder.name,
    content: `${folder.doc_count} 篇文档`,
    meta: metaFormatters[archiveSortStore.sortField](folder),
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
