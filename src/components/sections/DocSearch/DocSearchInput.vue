<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from "vue";
import { useDocSearchStore } from "@/stores/docSearch";
import { useDocSearch } from "@/composables/useDocSearch";

// 输入框引用，用于组件挂载后手动聚焦
const inputRef = useTemplateRef("inputRef");

const docSearchStore = useDocSearchStore();
const { searchDocs } = useDocSearch();

onMounted(() => {
  inputRef.value?.focus();
});

// 元函数：关键词变化时立即执行搜索（纯本地应用，无需防抖）
watch(
  () => docSearchStore.query,
  (query) => searchDocs(query),
);
</script>

<template>
  <input
    ref="inputRef"
    v-model="docSearchStore.query"
    class="mb-1 h-14 w-full bg-white ring ring-gray-300 outline-none focus:ring-purple-400 px-4"
    type="text"
    placeholder="搜索文档标题与内容" />
</template>
