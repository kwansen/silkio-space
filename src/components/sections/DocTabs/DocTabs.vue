<script setup lang="ts">
import Doc from "@/components/icons/Doc.vue";
import DocFill from "@/components/icons/DocFill.vue";
import Archive from "@/components/icons/Archive.vue";
import ArchiveFill from "@/components/icons/ArchiveFill.vue";
import DocSearch from "@/components/icons/DocSearch.vue";
import DocSearchFill from "@/components/icons/DocSearchFill.vue";
import ArchiveSearch from "@/components/icons/ArchiveSearch.vue";
import ArchiveSearchFill from "@/components/icons/ArchiveSearchFill.vue";
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
  { key: "docSort", icon: Doc, activeIcon: DocFill, pop: "文档概览" },
  {
    key: "docSearch",
    icon: DocSearch,
    activeIcon: DocSearchFill,
    pop: "文档搜索",
  },
  {
    key: "archiveSort",
    icon: Archive,
    activeIcon: ArchiveFill,
    pop: "归档概览",
  },
  {
    key: "archiveSearch",
    icon: ArchiveSearch,
    activeIcon: ArchiveSearchFill,
    pop: "归档搜索",
  },
];
</script>

<template>
  <div>
    <div
      v-for="option in options"
      class="w-full aspect-square grid place-items-center cursor-pointer"
    >
      <div
        class="size-8 rounded-md grid place-items-center hover:bg-gray-100 relative group"
        @click="setDocTab(option.key)"
      >
        <component
          :is="tab === option.key ? option.activeIcon : option.icon"
          class="size-5"
          :class="tab === option.key ? 'text-purple-700' : 'text-gray-500'"
        />
        <div
          class="hidden bg-white text-xs shadow-xs px-4 py-1 rounded-md group-hover:block absolute left-10 top-1/2 -translate-y-1/2 z-100 whitespace-nowrap"
        >
          {{ option.pop }}
        </div>
      </div>
    </div>
  </div>
</template>
