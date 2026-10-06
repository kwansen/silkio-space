<script setup lang="ts">
import DocSearchInput from "./DocSearchInput.vue";
import DocSearchList from "./DocSearchList.vue";
import DocSearchPagination from "./DocSearchPagination.vue";
</script>

<template>
  <div class="bg-white rounded-2xl p-4 mt-14">
    <DocSearchInput  />
    <DocSearchList />
    <DocSearchPagination />
  </div>
</template>
