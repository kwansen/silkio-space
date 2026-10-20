<script setup lang="ts">
import { useDocAction } from "@/actions/docAction";
import ArrowLeft from "@/components/icons/ArrowLeft.vue";
import ArrowRight from "@/components/icons/ArrowRight.vue";
import { useDocSortStore } from "@/stores/docSortStore";
import { storeToRefs } from "pinia";

const action = useDocAction();

const store = useDocSortStore();
const { currentPage, totalPages } = storeToRefs(store);
</script>
<template>
  <div class="h-14 bg-white flex justify-center items-center gap-2">
    <!-- 上一页 -->
    <div
      @click="action.goPrev"
      class="w-9 h-9 rounded-md cursor-default grid place-items-center"
      :class="[currentPage <= 1 ? 'opacity-40' : 'hover:bg-gray-100']"
    >
      <ArrowLeft />
    </div>

    <div
      v-for="page in totalPages"
      @click="action.goToPage(page)"
      class="w-9 h-9 rounded-md cursor-default grid place-items-center"
      :class="[
        page === store.currentPage ? 'bg-purple-200' : 'hover:bg-gray-100',
      ]"
    >
      {{ page === -1 ? "..." : page }}
    </div>

    <!-- 下一页 -->
    <div
      @click="action.goNext"
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
