<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 160 99"
    fill="none"
    stroke="currentColor"
    stroke-width="1"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect v-if="kind === 'rect'" x="3" y="3" width="154" height="93" rx="8" vector-effect="non-scaling-stroke" />
    <path v-else-if="kind === 'diamond'" d="M80 3 157 49.5 80 96 3 49.5Z" vector-effect="non-scaling-stroke" />
    <ellipse v-else-if="kind === 'ellipse'" cx="80" cy="49.5" rx="77" ry="46.5" vector-effect="non-scaling-stroke" />
    <path v-else-if="kind === 'parallelogram'" d="M31 3h126l-28 93H3z" vector-effect="non-scaling-stroke" />
    <path v-else-if="kind === 'hexagon'" d="M26 3h105l26 46.5-26 46.5H26L3 49.5z" vector-effect="non-scaling-stroke" />
    <template v-else-if="kind === 'database'">
      <ellipse cx="80" cy="17" rx="77" ry="14" vector-effect="non-scaling-stroke" />
      <path d="M3 17v62c0 7.7 34.5 14 77 14s77-6.3 77-14V17" vector-effect="non-scaling-stroke" />
      <path d="M3 48.5c0 7.7 34.5 14 77 14s77-6.3 77-14" vector-effect="non-scaling-stroke" />
    </template>
    <template v-else-if="kind === 'note'">
      <path d="M3 3h137l17 17v76H3z" vector-effect="non-scaling-stroke" />
      <path d="M140 3v17h17" vector-effect="non-scaling-stroke" />
    </template>
  </svg>
</template>

<script setup lang="ts">
// 形状预览图标（添加/替换菜单共用）：按节点真实默认尺寸 160×99 等比绘制，
// 与画布上的实际形状保持同一长宽比例与轮廓；non-scaling-stroke 锁定 1px 描边。
defineProps<{ kind: string }>();
</script>
