<script setup lang="ts">
import ArchiveSortList from "./ArchiveSortList.vue";
import ArchiveSortOption from "./ArchiveSortOption.vue";
import ArchiveSortEmpty from "./ArchiveSortEmpty.vue";
import ArchiveInput from "./ArchiveInput.vue";
import { useArchiveStore } from "@/stores/archiveStore.ts";
import { storeToRefs } from "pinia";
const store = useArchiveStore();
const { show, sortedArchives } = storeToRefs(store);
</script>

<template>
  <div>
    <ArchiveSortOption />
    <!-- 垂直 padding 只在有输入行或列表时应用，空态提示行保持自身 h-15 总高 -->
    <div
      class="px-1"
      :class="sortedArchives.length > 0 || show ? 'pt-1 pb-4' : ''"
    >
      <ArchiveInput v-if="show" />
      <ArchiveSortEmpty v-if="!show && sortedArchives.length === 0" />
      <ArchiveSortList />
    </div>
  </div>
</template>
