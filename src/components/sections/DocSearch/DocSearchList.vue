<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed, ref } from "vue";
import { useDocSearchStore } from "@/stores/docSearch";
import { useDocSearch } from "@/composables/useDocSearch.ts";

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

// popover 菜单：删除当前文档（key 由 DocList 注入，为当前文档 id）
const popoverList = ref<PopoverItem[]>([
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
  <div
    v-if="items.length < 1 && docSearchStore.query"
    class="h-15 flex items-center justify-center border-b border-gray-100"
  >
    未找到匹配的文档，尝试使用其他关键词搜索。
  </div>
</template>
