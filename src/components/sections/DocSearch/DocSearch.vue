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
    <DocSearchInput />
    <DocSearchEmpty v-if="docs.length === 0 && query" />
    <DocSearchList />
    <DocSearchPagination v-if="totalPages > 1" />
  </div>
</template>
