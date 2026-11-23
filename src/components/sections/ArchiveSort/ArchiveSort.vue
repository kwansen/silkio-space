<script setup lang="ts">
import ArchiveSortList from "./ArchiveSortList.vue";
import ArchiveSortOption from "./ArchiveSortOption.vue";
import ArchiveSortEmpty from "./ArchiveSortEmpty.vue";
import ArchiveInput from "./ArchiveInput.vue";
import { useArchiveStore } from "@/stores/archiveStore.ts";
import { storeToRefs } from "pinia";
import { computed } from "vue";
const store = useArchiveStore();
const { show, sortedArchives } = storeToRefs(store);

// 有输入行或列表内容时才加垂直 padding，空态提示行保持自身 h-15 总高
const hasContent = computed(
  () => sortedArchives.value.length > 0 || show.value,
);
</script>

<template>
  <div>
    <ArchiveSortOption />
    <div class="px-1 space-y-1" :class="hasContent ? 'pt-1 pb-5' : ''">
      <ArchiveInput v-if="show" />
      <ArchiveSortEmpty v-if="!show && sortedArchives.length === 0" />
      <ArchiveSortList v-if="sortedArchives.length > 0" />
    </div>
  </div>
</template>
