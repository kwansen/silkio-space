<script setup lang="ts">
import Doc from "@/components/icons/Doc.vue";
import DocMian from "@/components/icons/DocMian.vue";
import Archive from "@/components/icons/Archive.vue";
import ArchiveMian from "@/components/icons/ArchiveMian.vue";
import DocSearch from "@/components/icons/DocSearch.vue";
import DocSearchMian from "@/components/icons/DocSearchMian.vue";
import ArchiveSearch from "@/components/icons/ArchiveSearch.vue";
import ArchiveSearchMian from "@/components/icons/ArchiveSearchMian.vue";
import { useUiStore } from "@/stores/uiStore.ts";
import { storeToRefs } from "pinia";
import type { Component } from "vue";

const store = useUiStore();
const { setDocTab } = store;
const { docTab: tab } = storeToRefs(store);

const options: {
  key: DocTabOption;
  icon: Component;
  activeIcon: Component;
  pop: string;
}[] = [
  { key: "docSort", icon: Doc, activeIcon: DocMian, pop: "文档概览" },
  { key: "docSearch", icon: DocSearch, activeIcon: DocSearchMian, pop: "文档搜索" },
  { key: "archiveSort", icon: Archive, activeIcon: ArchiveMian, pop: "归档概览" },
  {
    key: "archiveSearch",
    icon: ArchiveSearch,
    activeIcon: ArchiveSearchMian,
    pop: "归档搜索",
  },
];
</script>

<template>
  <div>
    <div
      v-for="option in options"
      class="w-full aspect-square grid place-items-center cursor-pointer relative group"
      @click="setDocTab(option.key)"
    >
      <div
        class="size-7 rounded-md grid place-items-center hover:bg-gray-100"
      >
        <component
          :is="tab === option.key ? option.activeIcon : option.icon"
          class="size-5"
          :class="tab === option.key ? 'text-purple-700' : 'text-gray-500'"
        />
      </div>
      <div
        class="hidden bg-white text-xs shadow-xs px-4 py-1 rounded-md group-hover:block absolute left-12 top-1/2 -translate-y-1/2 z-100 whitespace-nowrap"
      >
        {{ option.pop }}
      </div>
    </div>
  </div>
</template>
