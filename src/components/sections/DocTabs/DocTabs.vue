<script setup lang="ts">
import type { Component } from "vue";
import SquareButton from "@/components/shared/SquareButton.vue";
import Doc from "@/components/icons/Doc.vue";
import DocSearch from "@/components/icons/DocSearch.vue";
import Archive from "@/components/icons/Archive.vue";
import ArchiveSearch from "@/components/icons/ArchiveSearch.vue";
import type { DocTabIconKey } from "@/icons";
import { useDocTabStore } from "@/stores/docTab";

interface Item {
  name: DocTabIconKey;
  icon: Component;
}

const tabs: Item[] = [
  { name: "docSort", icon: Doc },
  { name: "docSearch", icon: DocSearch },
  { name: "archiveSort", icon: Archive },
  { name: "archiveSearch", icon: ArchiveSearch },
];

const store = useDocTabStore();
const { setTab } = store;

const getClass = (v: DocTabIconKey) => {
  return store.tab === v
    ? "bg-purple-200 text-neutral-700"
    : "hover:bg-gray-100 text-neutral-400";
};
</script>

<template>
  <div class="w-10 h-full">
    <SquareButton
      v-for="tab in tabs"
      :key="tab.name"
      :class="getClass(tab.name)"
      @click="setTab(tab.name)"
    >
      <component :is="tab.icon" class="w-5 h-5" />
    </SquareButton>
  </div>
</template>
