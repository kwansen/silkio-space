<script setup lang="ts">
import { useSortDocStore } from "@/stores/sortDoc";
import { useSortDocs } from "@/composables/useSortDocs";

const store = useSortDocStore();
const { refreshDocs } = useSortDocs();

const goToPage = async (v: number) => {
  if (v <= 0 || v > store.totalPages) return;
  if (v === store.currentPage) return;
  // 数据返回后页码与列表一次性更新，避免先设页码导致的高亮闪烁
  await refreshDocs({ page: v });
};

const goPrev = () => {
  // 已在第一页：不做任何更改
  if (store.currentPage <= 1) return;
  goToPage(store.currentPage - 1);
};

const goNext = () => {
  // 已在最后一页：不做任何更改
  if (store.currentPage >= store.totalPages) return;
  goToPage(store.currentPage + 1);
};
</script>

<template>
  <div class="h-14 bg-white flex justify-center items-center gap-2">
    <!-- 上一页 -->
    <div
      @click="goPrev"
      class="w-9 h-9 rounded-md cursor-default grid place-items-center"
      :class="[store.currentPage <= 1 ? 'opacity-40' : 'hover:bg-gray-100']"
    >
      &lt;
    </div>

    <div
      v-for="page in store.pages"
      @click="goToPage(page)"
      class="w-9 h-9 rounded-md cursor-default grid place-items-center"
      :class="[page === store.currentPage ? 'bg-purple-200' : 'hover:bg-gray-100']"
    >
      {{ page === -1 ? '...' : page }}
    </div>

    <!-- 下一页 -->
    <div
      @click="goNext"
      class="w-9 h-9 rounded-md cursor-default grid place-items-center"
      :class="[store.currentPage >= store.totalPages ? 'opacity-40' : 'hover:bg-gray-100']"
    >
      &gt;
    </div>
  </div>
</template>
