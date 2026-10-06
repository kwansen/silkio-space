<script setup lang="ts">
import { useSortDocStore } from "@/stores/sortDoc";
import { useSortDocs } from "@/composables/useSortDocs";

const store = useSortDocStore();
const { refreshDocs } = useSortDocs();

const goToPage = async (v: number) => {
  if (v <= 0) return;
  if (v === store.currentPage) return;
  // 数据返回后页码与列表一次性更新，避免先设页码导致的高亮闪烁
  await refreshDocs(v);
};
</script>

<template>
  <div class="h-14 bg-white flex justify-center items-center gap-2">
    <div
      v-for="page in store.pages"
      @click="goToPage(page)"
      class="w-9 h-9 rounded-md  cursor-default grid place-items-center"
     :class="[page===store.currentPage?'bg-purple-200':'hover:bg-gray-100']">
      {{ page }}
    </div>
  </div>
</template>
