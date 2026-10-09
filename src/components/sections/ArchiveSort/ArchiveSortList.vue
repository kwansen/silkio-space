<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import ArchiveRenameDialog from "@/components/shared/ArchiveRenameDialog.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed, ref } from "vue";
import { useArchiveSortStore } from "@/stores/archiveSort";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";
import type { FolderSortField, Folder } from "@/infrastructure/db/folder.ts";
import ArchiveSortEmpty from "./ArchiveSortEmpty.vue";

export type { Item };

interface Emits {
  onClick: [item: Item];
}

const emit = defineEmits<Emits>();

const archiveSortStore = useArchiveSortStore();

// 各排序字段对应的 meta 展示：最近打开显示日期和时间（从未打开则不显示）；名称/自由排序无对应 meta
const metaFormatters: Partial<
  Record<FolderSortField, (folder: Folder) => string>
> = {
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

// 元函数：组装归档排序组合式函数
const { refreshFolders, reorderFolders, removeFolder, renameFolder } =
  useArchiveSort();

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

// 待编辑归档：非空时渲染重命名弹窗
const editFolder = ref<Folder | null>(null);

// 元函数：确认编辑后重命名，完成后关闭弹窗
const handleRename = async (name: string) => {
  if (!editFolder.value) return;
  try {
    await renameFolder(editFolder.value.id, name);
  } catch (e) {
    console.error(e);
  }
  editFolder.value = null;
};

// popover 菜单：编辑（打开重命名弹窗）与删除（key 由 DocList 注入，为当前归档 id）
const popoverList = ref<PopoverItem[]>([
  {
    icon: "mdi:pencil-outline",
    name: "编辑",
    action: (key) => {
      if (key === null || key === undefined) return;
      editFolder.value =
        archiveSortStore.folders.find((f) => f.id === String(key)) ?? null;
    },
  },
  {
    icon: "mdi:delete-outline",
    name: "删除",
    action: async (key) => {
      if (key === null || key === undefined) return;
      await removeFolder(String(key));
    },
  },
]);
</script>

<template>
  <DocList
    :list="items"
    :popover-list="popoverList"
    :draggable="isFreeSort"
    simple
    @onClick="handleClick"
    @onDragEnd="handleDragEnd"
  />
  <ArchiveSortEmpty v-if="items.length === 0" />
  <ArchiveRenameDialog
    :folder="editFolder"
    @on-close="editFolder = null"
    @on-confirm="handleRename"
  />
</template>
