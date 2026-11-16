<script setup lang="ts">
// comark 的解析是异步的：每个实例只应用最新一次的结果，避免慢一帧的
// 旧渲染覆盖流式新内容。安全过滤（危险链接/属性/原始 HTML）在 markdown.ts
// 的 security 插件中完成，故此处可安全使用 v-html。
import { ref, watch } from "vue";
import { renderMarkdown } from "../markdown";

const props = defineProps<{ value: string; streaming?: boolean }>();
const html = ref("");
let seq = 0;

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

watch(
  () => [props.value, props.streaming] as const,
  () => {
    const token = ++seq;
    void renderMarkdown(props.value, props.streaming ?? false)
      .then((out) => {
        if (token === seq) html.value = out;
      })
      .catch(() => {
        // 解析异常时退回纯文本（转义后交给 v-html）
        if (token === seq) html.value = escapeHtml(props.value);
      });
  },
  { immediate: true },
);
</script>

<template>
  <div v-html="html"></div>
</template>
