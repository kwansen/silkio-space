<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed, ref } from "vue";
import { useArchiveSearchStore } from "@/stores/archiveSearch";
import { useArchiveSearch } from "@/composables/useArchiveSearch.ts";

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
const { removeFolder } = useArchiveSearch();

// popover 菜单：删除当前归档（key 由 DocList 注入，为当前归档 id）
const popoverList = ref<PopoverItem[]>([
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
  <DocList :list="items" :popover-list="popoverList" simple @onClick="handleClick" />
  <div
    v-if="items.length < 1 && archiveSearchStore.query"
    class="h-15 flex items-center justify-center border-b border-gray-100"
  >
    未找到匹配的归档，尝试使用其他关键词搜索。
  </div>
</template>
