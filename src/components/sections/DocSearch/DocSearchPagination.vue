<script setup lang="ts">
import ChevronLeft from "@/components/icons/ChevronLeft.vue";
import ChevronRight from "@/components/icons/ChevronRight.vue";
import { useDocSearchStore } from "@/stores/docSearchStore";
import { generatePages } from "@zhencai/generate-pages";
import { storeToRefs } from "pinia";
import { computed } from "vue";

const store = useDocSearchStore();
const { currentPage, totalPages } = storeToRefs(store);
const { prevPage, nextPage, goToPage } = store;
const pages = computed(() =>
  generatePages(currentPage.value, totalPages.value),
);
</script>

<template>
  <div
    class="h-16 bg-white flex justify-center items-center gap-2 border-t border-gray-100"
  >
    <!-- 上一页 -->
    <div
      @click="prevPage"
      class="w-9 h-9 rounded-md cursor-pointer grid place-items-center"
      :class="[store.currentPage <= 1 ? 'opacity-40' : 'hover:bg-gray-100']"
    >
      <ChevronLeft class="size-5" />
    </div>

    <div
      v-for="page in pages"
      @click="goToPage(page)"
      class="w-9 h-9 rounded-md cursor-pointer grid place-items-center"
      :class="[
        page === store.currentPage
          ? 'font-medium text-violet-600'
          : 'hover:bg-gray-100',
      ]"
    >
      {{ page === -1 ? "..." : page }}
    </div>

    <!-- 下一页 -->
    <div
      @click="nextPage"
      class="w-9 h-9 rounded-md cursor-pointer grid place-items-center"
      :class="[
        store.currentPage >= store.totalPages
          ? 'opacity-40'
          : 'hover:bg-gray-100',
      ]"
    >
      <ChevronRight class="size-5" />
    </div>
  </div>
</template>
