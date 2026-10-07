<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from "vue";
import { useArchiveSearchStore } from "@/stores/archiveSearch";
import { useArchiveSearch } from "@/composables/useArchiveSearch";

// 输入框引用，用于组件挂载后手动聚焦
const inputRef = useTemplateRef("inputRef");

const archiveSearchStore = useArchiveSearchStore();
const { searchFolders } = useArchiveSearch();

onMounted(() => {
  inputRef.value?.focus();
});

// 元函数：关键词变化时立即执行搜索（纯本地倒排索引，无需防抖）
watch(
  () => archiveSearchStore.query,
  (query) => searchFolders(query),
);
</script>

<template>
  <input
    ref="inputRef"
    v-model="archiveSearchStore.query"
    class="mb-1 h-14 w-full bg-white ring ring-gray-300 outline-none focus:ring-purple-400 px-4"
    type="text"
    placeholder="搜索归档名称" />
</template>
