<script setup lang="ts">
import ArchiveSortList from "./ArchiveSortList.vue";
import ArchiveSortOption from "./ArchiveSortOption.vue";
import ArchiveSortEmpty from "./ArchiveSortEmpty.vue";
import { useArchiveSortStore } from "@/stores/archiveSort";

const store = useArchiveSortStore();
</script>

<template>
  <div class="bg-white rounded-2xl p-4">
    <ArchiveSortOption />
    <ArchiveSortEmpty v-if="store.folders.length === 0" />
    <ArchiveSortList />
  </div>
</template>
