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
    <!-- 无搜索词且无结果时不渲染列表区，避免底部白色 padding 空悬；
         分隔线条件挂在搜索框上（border 在 h-16 内部），与排序 tab 头部的
         border-b 位置一致，切换 tab 时无 1px 偏移 -->
    <ArchiveSearchInput
      :class="archives.length > 0 || query ? 'border-b border-purple-300' : ''"
    />
    <div
      v-if="archives.length > 0 || query"
      class="px-1"
      :class="archives.length > 0 ? 'pt-1 pb-4' : ''"
    >
      <ArchiveSearchEmpty v-if="archives.length === 0 && query" />
      <ArchiveSearchList />
    </div>
  </div>
</template>
