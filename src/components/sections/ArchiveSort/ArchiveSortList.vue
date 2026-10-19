<script setup lang="ts">
import Folder from "@/components/icons/Folder.vue";
import ArchiveItem from "@/components/shared/ArchiveItem.vue";
import { useArchiveSortStore } from "@/stores/archiveSortStore";
import { storeToRefs } from "pinia";

const store = useArchiveSortStore();
const { archives } = storeToRefs(store);
</script>

<template>
  <ArchiveItem
    v-for="a in archives"
    :item-key="a.id"
    :name="a.name"
    :icon="Folder"
  />
</template>
