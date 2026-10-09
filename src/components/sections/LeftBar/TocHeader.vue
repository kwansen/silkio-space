<script setup lang="ts">
import { computed } from "vue";
import { useEditorViewStore } from "@/stores/editorView";
import { Icon } from "@iconify/vue";

const store = useEditorViewStore();

// 大纲视图头部标题：当前文档标题（空时显示占位）
const title = computed(() => store.doc?.title || "未命名标题");
</script>
<template>
  <div class="h-full flex items-center">
    <Icon icon="mdi:archive" class="w-4 h-4 mx-2 text-neutral-400" />
    <div class="truncate text-xs text-neutral-400">{{ title }}</div>
  </div>
</template>
