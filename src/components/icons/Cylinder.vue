<!-- 自绘：与node保持相似 -->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
  >
    <!-- 圆柱外轮廓：顶椭圆上半弧 + 两侧竖线 + 底部椭圆下半弧 -->
    <path
      d="M2 7.625
         A10 1.875 0 0 1 22 7.625
         L22 16.375
         A10 1.875 0 0 1 2 16.375
         Z"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
    />
    <!-- 顶部椭圆的下半弧，形成"盖子"的立体感 -->
    <path
      d="M2 7.625
         A10 1.875 0 0 0 22 7.625"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>
