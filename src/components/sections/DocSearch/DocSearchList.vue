<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed } from "vue";
import { useDocSearchStore } from "@/stores/docSearch";
import { useDocSearch } from "@/composables/useDocSearch.ts";
import { useArchivePickerStore } from "@/stores/archivePicker.ts";
import DocSearchEmpty from "./DocSearchEmpty.vue";

export type { Item };

interface Emits {
  onClick: [item: Item];
}

const emit = defineEmits<Emits>();

const docSearchStore = useDocSearchStore();

// 元函数：将当前页搜索结果转换为 DocList 列表项
const items = computed<Item[]>(() =>
  docSearchStore.pageResults.map((r) => ({
    key: r.id,
    title: r.title,
    content: r.content,
    docType: r.docType,
  })),
);

// 转发DocList的onClick事件
const handleClick = (item: Item) => {
  emit("onClick", item);
};

// 元函数：组装文档搜索组合式函数
const { removeDoc } = useDocSearch();

// 元函数：获取归档选择弹窗 store（弹窗状态自持，实例由 App.vue 全局挂载）
const archivePickerStore = useArchivePickerStore();

// popover 菜单：归档（唤起全局多选弹窗）与删除（key 由 DocList 注入，为当前文档 id）
const popoverList = computed<PopoverItem[]>(() => [
  {
    icon: "mdi:archive-outline",
    name: "归档",
    action: (key) => {
      if (key === null || key === undefined) return;
      archivePickerStore.open(String(key));
    },
  },
  {
    icon: "mdi:delete-outline",
    name: "删除",
    action: async (key) => {
      if (key === null || key === undefined) return;
      await removeDoc(String(key));
    },
  },
]);
</script>

<template>
  <DocList :list="items" :popover-list="popoverList" @onClick="handleClick" />
  <DocSearchEmpty v-if="items.length === 0 && docSearchStore.query" />
</template>
