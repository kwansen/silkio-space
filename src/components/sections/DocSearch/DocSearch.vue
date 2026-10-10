<script setup lang="ts">
import DocSearchInput from "./DocSearchInput.vue";
import DocSearchList from "./DocSearchList.vue";
import DocSearchEmpty from "./DocSearchEmpty.vue";
import DocSearchPagination from "./DocSearchPagination.vue";
import { useDocSearchStore } from "@/stores/docSearch";

const store = useDocSearchStore();
</script>

<template>
  <div class="bg-white rounded-2xl p-4">
    <DocSearchInput />
    <DocSearchEmpty v-if="store.pageResults.length === 0 && store.query" />
    <DocSearchList />
    <DocSearchPagination v-if="store.pages.length > 1" />
  </div>
</template>
