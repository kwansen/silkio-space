<script setup lang="ts">
// 线性图标统一走 IconSprites 提供的 symbol（按 name 取用），
// 描边颜色跟随 currentColor，尺寸等细节经 class 透传
defineProps<{ name: string }>();
</script>

<template>
  <svg
    class="shrink-0 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round]"
    aria-hidden="true"
  >
    <use :href="`#${name}`" />
  </svg>
</template>
