<script setup lang="ts">
import DocSearchInput from "./DocSearchInput.vue";
import DocSearchList from "./DocSearchList.vue";
import DocSearchPagination from "./DocSearchPagination.vue";
</script>

<template>
  <div>
    <DocSearchInput />
    <div class="h-2"></div>
    <DocSearchList />
    <div class="h-2"></div>
    <DocSearchPagination />
  </div>
</template>
