<script setup lang="ts">
import { useDocSearchStore } from "@/stores/docSearchStore.ts";
import DocSearchEmpty from "./DocSearchEmpty.vue";
import DocSearchInput from "./DocSearchInput.vue";
import DocSearchList from "./DocSearchList.vue";
import DocSearchPagination from "./DocSearchPagination.vue";
import { storeToRefs } from "pinia";

const store = useDocSearchStore();
const { docsThisPage: docs, totalPages, query } = storeToRefs(store);
</script>

<template>
  <div>
    <!-- 分隔线与归档搜索同策略：仅在下方有提示或列表（即有搜索词）时显示，
         border 在 h-16 内部，与排序 tab 头部 border-b 位置一致 -->
    <DocSearchInput :class="query ? 'border-b border-purple-300' : ''" />
    <DocSearchEmpty v-if="docs.length === 0 && query" />
    <DocSearchList />
    <DocSearchPagination v-if="totalPages > 1" />
  </div>
</template>
