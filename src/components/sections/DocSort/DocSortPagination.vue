<script setup lang="ts">
import LeftFill from "@/components/icons/LeftFill.vue";
import RightFill from "@/components/icons/RightFill.vue";
import { useDocSortStore } from "@/stores/docSortStore";
import { storeToRefs } from "pinia";

const store = useDocSortStore();
const { currentPage, totalPages } = storeToRefs(store);
</script>
<template>
  <div
    class="h-16 bg-white flex justify-center items-center gap-2 border-t border-gray-100"
  >
    <!-- 上一页 -->
    <div
      @click="store.goSortedPrev"
      class="w-9 h-9 rounded-md cursor-pointer grid place-items-center"
      :class="[currentPage <= 1 ? 'opacity-40' : 'hover:bg-gray-100']"
    >
      <LeftFill class="size-4" />
    </div>

    <div
      v-for="page in totalPages"
      @click="store.goToSortedPage(page)"
      class="w-9 h-9 rounded-md cursor-pointer grid place-items-center"
      :class="[
        page === store.currentPage ? 'bg-purple-200' : 'hover:bg-gray-100',
      ]"
    >
      {{ page }}
    </div>

    <!-- 下一页 -->
    <div
      @click="store.goSortedNext"
      class="w-9 h-9 rounded-md cursor-pointer grid place-items-center"
      :class="[
        store.currentPage >= store.totalPages
          ? 'opacity-40'
          : 'hover:bg-gray-100',
      ]"
    >
      <RightFill class="size-4" />
    </div>
  </div>
</template>
