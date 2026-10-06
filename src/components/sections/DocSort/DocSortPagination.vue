<script setup lang="ts">
import { useSortDocStore } from "@/stores/sortDoc";

const store = useSortDocStore();

const goToPage = (v: number) => {
  if (v <= 0) return;
  else if (v === store.currentPage) return;
  else {
    store.setCurrentPage(v);
  }
};
</script>

<template>
  <div class="h-14 bg-white flex justify-center items-center gap-2">
    <div
      v-for="page in store.pages"
      @click="goToPage(page)"
      class="w-9 h-9 rounded-md hover:bg-gray-100 cursor-pointer grid place-items-center"
    >
      {{ page }}
    </div>
  </div>
</template>
