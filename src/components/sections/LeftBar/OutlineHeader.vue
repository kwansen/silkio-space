<script setup lang="ts">
import { computed } from "vue";
import { useEditorViewStore } from "@/stores/editorView";

const store = useEditorViewStore();

// 大纲视图头部标题：当前文档标题（空时显示占位）
const title = computed(() => store.doc?.title || "未命名标题");
</script>
<template>
  <!-- 大纲视图头部：显示当前文档标题 -->
  <div class="h-9 flex items-center hover:bg-gray-100 px-2 rounded-md">
    <div class="truncate">{{ title }}</div>
    <div class="flex-1"></div>
  </div>
</template>
