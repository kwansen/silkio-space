<script setup lang="ts">
import { useDocSearchAction } from "@/actions/docSearch";
import ArrowLeft from "@/components/icons/ArrowLeft.vue";
import ArrowRight from "@/components/icons/ArrowRight.vue";
import { useDocSearchStore } from "@/stores/docSearchStore";
import { generatePages } from "@zhencai/generate-pages";
import { storeToRefs } from "pinia";
import { computed } from "vue";

const store = useDocSearchStore();
const { currentPage, totalPages } = storeToRefs(store);
const { goPrev, goNext, goToPage } = useDocSearchAction();
const pages = computed(() =>
  generatePages(currentPage.value, totalPages.value),
);
</script>

<template>
  <div class="h-14 bg-white flex justify-center items-center gap-2">
    <!-- 上一页 -->
    <div
      @click="goPrev"
      class="w-9 h-9 rounded-md cursor-default grid place-items-center"
      :class="[store.currentPage <= 1 ? 'opacity-40' : 'hover:bg-gray-100']"
    >
      <ArrowLeft />
    </div>

    <div
      v-for="page in pages"
      @click="goToPage(page)"
      class="w-9 h-9 rounded-md cursor-default grid place-items-center"
      :class="[
        page === store.currentPage ? 'bg-purple-200' : 'hover:bg-gray-100',
      ]"
    >
      {{ page === -1 ? "..." : page }}
    </div>

    <!-- 下一页 -->
    <div
      @click="goNext"
      class="w-9 h-9 rounded-md cursor-default grid place-items-center"
      :class="[
        store.currentPage >= store.totalPages
          ? 'opacity-40'
          : 'hover:bg-gray-100',
      ]"
    >
      <ArrowRight />
    </div>
  </div>
</template>
