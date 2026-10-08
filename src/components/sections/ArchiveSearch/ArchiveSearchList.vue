<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import ArchiveRenameDialog from "@/components/shared/ArchiveRenameDialog.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed, ref } from "vue";
import { useArchiveSearchStore } from "@/stores/archiveSearch";
import { useArchiveSearch } from "@/composables/useArchiveSearch.ts";
import type { Folder } from "@/infrastructure/db/folder.ts";
import ArchiveSearchEmpty from "./ArchiveSearchEmpty.vue";

export type { Item };

interface Emits {
  onClick: [item: Item];
}

const emit = defineEmits<Emits>();

const archiveSearchStore = useArchiveSearchStore();

// 元函数：将命中归档转换为 DocList 列表项（simple 模式仅展示名称）
const items = computed<Item[]>(() =>
  archiveSearchStore.results.map((folder) => ({
    key: folder.id,
    title: folder.name,
    content: "",
    docType: "folder",
  })),
);

// 转发DocList的onClick事件
const handleClick = (item: Item) => {
  emit("onClick", item);
};

// 元函数：组装归档搜索组合式函数
const { renameFolder, removeFolder } = useArchiveSearch();

// 待编辑归档：非空时渲染重命名弹窗
const editFolder = ref<Folder | null>(null);

// 元函数：确认编辑后重命名并同步索引，完成后关闭弹窗
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
        archiveSearchStore.results.find((f) => f.id === String(key)) ?? null;
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
    simple
    @onClick="handleClick"
  />
  <ArchiveSearchEmpty v-if="items.length < 1 && archiveSearchStore.query" />
  <ArchiveRenameDialog
    :folder="editFolder"
    @on-close="editFolder = null"
    @on-confirm="handleRename"
  />
</template>
