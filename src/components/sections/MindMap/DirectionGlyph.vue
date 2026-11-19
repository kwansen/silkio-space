<template>
  <!-- 布局方向示意图（参照 .examples/mindmap 的 i-layout-* 符号）：
       大圆为根节点，小圆为子节点，总线+分支表达延展方向。
       正方形 viewBox，与 EdgeGlyph 同风格（0.75 描边）；
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
    <template v-if="value === 'right'">
      <circle cx="7" cy="12" r="2.2" />
      <circle cx="18" cy="5" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
      <circle cx="18" cy="19" r="1.6" />
      <path d="M9.2 12H13M13 5v14M13 5h3.4M13 12h3.4M13 19h3.4" />
    </template>
    <template v-else-if="value === 'left'">
      <circle cx="17" cy="12" r="2.2" />
      <circle cx="6" cy="5" r="1.6" />
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="6" cy="19" r="1.6" />
      <path d="M14.8 12H11M11 5v14M11 5H7.6M11 12H7.6M11 19H7.6" />
    </template>
    <template v-else-if="value === 'both'">
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="5" cy="7" r="1.7" />
      <circle cx="5" cy="17" r="1.7" />
      <circle cx="19" cy="7" r="1.7" />
      <circle cx="19" cy="17" r="1.7" />
      <path d="M9.8 12H8M8 7v10M8 7H6.7M8 17H6.7M14.2 12H16M16 7v10M16 7h1.3M16 17h1.3" />
    </template>
    <template v-else-if="value === 'down'">
      <circle cx="12" cy="4.5" r="2" />
      <circle cx="5" cy="15" r="1.7" />
      <circle cx="12" cy="15" r="1.7" />
      <circle cx="19" cy="15" r="1.7" />
      <path d="M12 6.5V10M5 10h14M5 10v3.3M12 10v3.3M19 10v3.3" />
    </template>
  </svg>
</template>

<script setup lang="ts">
// 工具栏内联展示用小图，尺寸固定
defineProps<{ value: string }>();
</script>
