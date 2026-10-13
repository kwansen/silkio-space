<script setup lang="ts">
import Doc from "@/components/icons/Doc.vue";
import Archive from "@/components/icons/Archive.vue";
import DocSearch from "@/components/icons/DocSearch.vue";
import ArchiveSearch from "@/components/icons/ArchiveSearch.vue";
import { useUiStore } from "@/stores/uiStore.ts";
import { storeToRefs } from "pinia";
import type { Component } from "vue";

const store = useUiStore();
const { setDocTab } = store;
const { currentDocTab: tab } = storeToRefs(store);

const options: { key: DocTabOption; icon: Component }[] = [
  { key: "docSort", icon: Doc },
  { key: "docSearch", icon: DocSearch },
  { key: "archiveSort", icon: Archive },
  { key: "archiveSearch", icon: ArchiveSearch },
];
</script>

<template>
  <div>
    <div
      v-for="option in options"
      class="w-full aspect-square grid place-items-center"
      :class="tab === option.key ? 'bg-purple-200' : 'hover:bg-gray-100'"
      @click="setDocTab(option.key)"
    >
      <component :is="option.icon" />
    </div>
  </div>
</template>
