<script setup lang="ts">
import ArchiveSearchInput from "./ArchiveSearchInput.vue";
import ArchiveSearchList from "./ArchiveSearchList.vue";
import ArchiveSearchEmpty from "./ArchiveSearchEmpty.vue";
import { useArchiveSearchStore } from "@/stores/archiveSearch";

const store = useArchiveSearchStore();
</script>

<template>
  <div class="bg-white rounded-2xl p-4">
    <ArchiveSearchInput />
    <ArchiveSearchEmpty
      v-if="store.archives.length === 0 && store.query"
    />
    <ArchiveSearchList />
  </div>
</template>
