<script setup lang="ts">
import { useArchiveStore } from "@/stores/archiveStore.ts";
import ArchiveSearchEmpty from "./ArchiveSearchEmpty.vue";
import ArchiveSearchInput from "./ArchiveSearchInput.vue";
import ArchiveSearchList from "./ArchiveSearchList.vue";
import { storeToRefs } from "pinia";

const store = useArchiveStore();
const { searchedArchives: archives, query } = storeToRefs(store);
</script>

<template>
  <div class="bg-white rounded-2xl">
    <ArchiveSearchInput />
    <ArchiveSearchEmpty v-if="archives.length === 0 && query" />
    <ArchiveSearchList />
  </div>
</template>
