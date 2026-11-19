<template>
  <!-- 连线样式示意图（参照 .examples/mindmap 的 i-edge-* 符号）：两端实心点为节点，
       三种线型仅角部处理不同——S 曲线 / 直角 Z 折线 / 圆角 Z 折线，便于横向对比。
       width/height 为兜底尺寸，使用处可用 class（如 size-8）覆盖 -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    stroke-width="0.75"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-if="value === 'bezier'">
      <path d="M5 18C11 18 13 6 19 6" />
    </template>
    <template v-else-if="value === 'path'">
      <path d="M5 18h7V6h7" />
    </template>
    <template v-else-if="value === 'rPath'">
      <path d="M5 18h7V9a3 3 0 0 1 3-3h4" />
    </template>
    <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="19" cy="6" r="1.5" fill="currentColor" stroke="none" />
  </svg>
</template>

<script setup lang="ts">
// 工具栏内联展示用小图，尺寸固定
defineProps<{ value: string }>();
</script>
