<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed, ref } from "vue";
import { useSortDocStore } from "@/stores/sortDoc";
import type { Doc, SortField } from "@/infrastructure/db/document.ts";

export type { Item };

interface Emits {
  onClick: [item: Item];
}

const emit = defineEmits<Emits>();

const sortDocStore = useSortDocStore();

// 各排序字段对应的 meta 展示：时间字段显示日期，字数显示数值
const metaFormatters: Record<SortField, (doc: Doc) => string> = {
  viewed_at: (doc) => new Date(doc.viewed_at).toLocaleDateString(),
  updated_at: (doc) => new Date(doc.updated_at).toLocaleDateString(),
  created_at: (doc) => new Date(doc.created_at).toLocaleDateString(),
  word_count: (doc) => `${doc.word_count} 字`,
};

// 元函数：将文档列表转换为 DocList 列表项，meta 随当前排序字段联动
const items = computed<Item[]>(() =>
  sortDocStore.docs.map((doc) => ({
    key: doc.id,
    title: doc.title ?? "未命名标题",
    content: doc.plain_text ?? "",
    meta: metaFormatters[sortDocStore.sortField](doc),
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
