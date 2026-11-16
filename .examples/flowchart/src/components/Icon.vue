<script setup lang="ts">
// 线性图标统一走 IconSprites 提供的 symbol，保持与工具条同一套描边尺度
withDefaults(
  defineProps<{ name: string; size?: string; stroke?: string }>(),
  { size: "h-4 w-4", stroke: "stroke-[1.5]" },
);
</script>

<template>
  <svg
    :class="[
      'shrink-0 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round]',
      stroke,
      size,
    ]"
    aria-hidden="true"
  >
    <use :href="`#${name}`" />
  </svg>
</template>
