<script setup lang="ts">
import ArchiveList, { Item } from "@/components/shared/ArchiveList.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed, ref } from "vue";
import { useArchiveSearchStore } from "@/stores/archiveSearch";
import { useArchiveSearch } from "@/composables/useArchiveSearch.ts";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";
import { useArchiveRenameStore } from "@/stores/archiveRename.ts";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";
import ArchiveSearchEmpty from "./ArchiveSearchEmpty.vue";

export type { Item };

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

// 元函数：组装归档搜索组合式函数
const { removeFolder } = useArchiveSearch();

const archiveRenameStore = useArchiveRenameStore();

// popover 菜单：编辑（唤起 App.vue 挂载的全局重命名弹窗）与删除（key 由 DocList 注入，为当前归档 id）
const popoverList = ref<PopoverItem[]>([
  {
    icon: "mdi:pencil-outline",
    name: "编辑",
    action: (key) => {
      if (key === null || key === undefined) return;
      const folder = archiveSearchStore.archives.find(
        (f) => f.id === String(key),
      );
      if (folder) archiveRenameStore.open(folder);
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
  <ArchiveList
    :list="items"
    :popover-list="popoverList"
    @onClick="handleClick"
  />
  <ArchiveSearchEmpty v-if="items.length === 0 && archiveSearchStore.query" />
</template>
