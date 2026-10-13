<script setup lang="ts">
import { useDocSortAction } from "@/actions/docSort";
import Add from "@/components/icons/Add.vue";
import { useUiStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";

const store = useUiStore();
const { currentDocSort: sort } = storeToRefs(store);
const { setDocSort } = store;
const action = useDocSortAction();
const list: { key: DocSortOption; show: string }[] = [
  { key: "viewedAt", show: "最近浏览" },
  { key: "updatedAt", show: "最近更新" },
  { key: "createdAt", show: "最近创建" },
  { key: "wordCount", show: "最多字数" },
];

const handleClick = (option: DocSortOption) => {
  setDocSort(option);
  action.getSortedDocs(option, 1);
};
</script>

<template>
  <div class="flex items-center py-2 gap-4 border-b border-purple-300">
    <div v-for="i in list" class="select-none" @click="handleClick(i.key)">
      <span :class="i.key === sort ? 'text-purple-700' : ''">
        {{ i.show }}
      </span>
      <div
        class="w-full h-1 rounded-full"
        :class="i.key === sort ? 'bg-purple-200' : ''"
      />
    </div>

    <div class="flex-1"></div>
    <div class="w-6 h-6 grid place-items-center bg-red-200 rounded-md">
      <Add />
    </div>
  </div>
</template>
