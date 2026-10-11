<script setup lang="ts">
import { useTemplateRef } from "vue";
import Add from "@/components/icons/Add.vue";
import { useDocAddPopoverStore } from "@/stores/docAddPopover";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import type { SortField } from "@/infrastructure/db/document";
import { useDocSortStore } from "@/stores/docSort";
const { refreshDocs } = useSortDocs();

const sortOptions: { key: SortField; show: string }[] = [
  {
    key: "viewed_at",
    show: "最近浏览",
  },
  {
    key: "updated_at",
    show: "最近更新",
  },
  {
    key: "created_at",
    show: "最近创建",
  },
  {
    key: "word_count",
    show: "最多字数",
  },
];
const store = useDocSortStore();
const handleSortChange = async (sort: SortField) => {
  if (store.sortField === sort) return;
  store.sortField = sort;
  await refreshDocs({ page: 1, sortField: sort });
};
const docAddPopoverStore = useDocAddPopoverStore();
const targetRef = useTemplateRef<HTMLElement>("targetRef");
const toggleOpen = () => {
  docAddPopoverStore.toggle(targetRef.value);
};
</script>

<template>
  <div
    class="h-10 flex items-center select-none border-b border-purple-300 gap-4"
  >
    <div
      v-for="option in sortOptions"
      :key="option.key"
      :class="
        store.sortField === option.key
          ? 'text-purple-700'
          : 'text-neutral-500 hover:text-neutral-700'
      "
      @click="handleSortChange(option.key)"
    >
      <div>{{ option.show }}</div>
      <div
        class="h-1 rounded-full w-full"
        :class="
          store.sortField === option.key ? 'bg-purple-200' : 'bg-transparent'
        "
      />
    </div>
    <div class="flex-1"></div>
    <div
      ref="targetRef"
      class="hover:bg-gray-200 text-sm rounded-md p-1"
      :class="[docAddPopoverStore.isOpen ? 'bg-gray-200' : '']"
      @click="toggleOpen"
    >
      <Add class="w-5 h-5" />
    </div>
  </div>
</template>
