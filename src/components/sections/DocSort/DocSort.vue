<script setup lang="ts">
import { useDocSortStore } from "@/stores/docSortStore.ts";
import DocSortEmpty from "./DocSortEmpty.vue";
import DocSortList from "./DocSortList.vue";
import DocSortOption from "./DocSortOption.vue";
import DocSortPagination from "./DocSortPagination.vue";
import { storeToRefs } from "pinia";
const store = useDocSortStore();
const { sortedDocs: docs, totalPages } = storeToRefs(store);
</script>

<template>
  <div>
    <DocSortOption />
    <DocSortEmpty v-if="docs.length === 0" />
    <DocSortList />
    <DocSortPagination v-if="totalPages > 1" />
  </div>
</template>
