<script setup lang="ts">
import { useArchiveSortStore } from "@/stores/archiveSortStore.ts";
import ArchiveSearchEmpty from "./ArchiveSearchEmpty.vue";
import ArchiveSearchInput from "./ArchiveSearchInput.vue";
import ArchiveSearchList from "./ArchiveSearchList.vue";
import { storeToRefs } from "pinia";

const store = useArchiveSortStore();
const { searchedArchives: archives, query } = storeToRefs(store);
</script>

<template>
  <div class="bg-white rounded-2xl p-4">
    <ArchiveSearchInput />
    <ArchiveSearchEmpty v-if="archives.length === 0 && query" />
    <ArchiveSearchList />
  </div>
</template>
