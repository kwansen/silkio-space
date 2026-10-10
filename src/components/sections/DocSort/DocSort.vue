<script setup lang="ts">
import DocSortList from "./DocSortList.vue";
import DocSortOption from "./DocSortOption.vue";
import DocSortPagination from "./DocSortPagination.vue";
import { useDocSortStore } from "@/stores/docSort.ts";

const docSortStore = useDocSortStore();
</script>

<template>
  <div class="bg-white rounded-2xl p-4">
    <DocSortOption />
    <DocSortList />
    <!-- 页码不超过 1 页时不渲染分页 -->
    <DocSortPagination v-if="docSortStore.pages.length > 1" />
  </div>
</template>
