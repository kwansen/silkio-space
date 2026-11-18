<template>
  <!-- Close 的小场景光学变体：与 Close.vue 同一图形，但 viewBox 外扩 2px 呼吸区
       （覆盖率 87.5% → 70%）。原版贴满 16 网格，小尺寸下视觉重量偏大，
       本变体在相同 CSS 尺寸下渲染出更小的图形，与 Add 等图标光学等重 -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    viewBox="-2 -2 20 20"
    width="16"
    height="16"
  >
    <path
      d="M1 1.884 L1 1 L1.884 1 L8 7.116 L14.116 1 L15 1 L15 1.884 L8.884 8 L15 14.116 L15 15 L14.116 15 L8 8.884 L1.884 15 L1 15 L1 14.116 L7.116 8 Z"
      fill="currentColor"
    />
  </svg>
</template>
