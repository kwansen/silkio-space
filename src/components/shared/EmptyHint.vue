<template>
  <!-- 空列表统一提示：文案与字号颜色固化，高度等布局由使用方传 class -->
  <div
    class="flex items-center justify-center text-xs text-neutral-400 select-none"
  >
    <slot>空空如也</slot>
  </div>
</template>
