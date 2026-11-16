<script setup lang="ts">
// AI 回答的 Markdown 渲染容器：解析在 markdown.ts 中先转义再生成受控
// HTML，可安全使用 v-html
import { computed } from "vue";
import { renderMarkdown } from "./markdown";

const props = defineProps<{ value: string }>();

const html = computed(() => renderMarkdown(props.value));
</script>

<template>
  <div v-html="html"></div>
</template>
