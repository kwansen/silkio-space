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
const { docTab: tab } = storeToRefs(store);

const options: { key: DocTabOption; icon: Component; pop: string }[] = [
  { key: "docSort", icon: Doc, pop: "文档概览" },
  { key: "docSearch", icon: DocSearch, pop: "文档搜索" },
  { key: "archiveSort", icon: Archive, pop: "归档概览" },
  { key: "archiveSearch", icon: ArchiveSearch, pop: "归档搜索" },
];
</script>

<template>
  <div>
    <div
      v-for="option in options"
      class="w-full aspect-square grid place-items-center cursor-pointer relative group"
      :class="tab === option.key ? 'bg-purple-200' : 'hover:bg-gray-100'"
      @click="setDocTab(option.key)"
    >
      <component
        :is="option.icon"
        class="size-5"
        :class="tab === option.key ? 'text-purple-700' : 'text-gray-500'"
      />
      <div
        class="hidden bg-white text-xs shadow-xs px-4 py-1 rounded-md group-hover:block absolute left-12 top-1/2 -translate-y-1/2 z-100 whitespace-nowrap"
      >
        {{ option.pop }}
      </div>
    </div>
  </div>
</template>
