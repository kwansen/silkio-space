<script setup lang="ts">
import ArchiveSortList from "./ArchiveSortList.vue";
import ArchiveSortOption from "./ArchiveSortOption.vue";
import ArchiveSortEmpty from "./ArchiveSortEmpty.vue";
import ArchiveInput from "./ArchiveInput.vue";
import { useArchiveSortStore } from "@/stores/archiveSortStore.ts";
import { storeToRefs } from "pinia";
const store = useArchiveSortStore();
const { show, archives } = storeToRefs(store);
</script>

<template>
  <div>
    <ArchiveSortOption />
    <ArchiveInput v-if="show" />
    <ArchiveSortEmpty v-if="!show && archives.length === 0" />
    <ArchiveSortList />
  </div>
</template>
