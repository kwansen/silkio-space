<script setup lang="ts">
import DocList, { Item } from "@/components/shared/DocList.vue";
import { PopoverItem } from "@/components/shared/Popover.vue";
import { computed, ref } from "vue";
import { useSortDocStore } from "@/stores/sortDoc";

export type { Item };

interface Emits {
  onClick: [item: Item];
}

const emit = defineEmits<Emits>();

const sortDocStore = useSortDocStore();

// 元函数：将文档列表转换为 DocList 列表项
const items = computed<Item[]>(() =>
  sortDocStore.docs.map((doc) => ({
    key: doc.id,
    title: doc.title ?? "未命名标题",
    content: doc.plain_text ?? "",
    meta: new Date(doc.updated_at).toLocaleDateString(),
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
