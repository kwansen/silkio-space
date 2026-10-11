<script setup lang="ts">
// Popover 仅负责布局（浮层容器样式），条目列表整体由调用方通过默认插槽提供；
// PopoverItem 是调用方约定共用的条目类型，Popover 自身不渲染条目
export interface PopoverItem {
  name: string;
}
</script>

<template>
  <div class="bg-white rounded-md shadow-lg p-1 z-10 select-none">
    <slot />
  </div>
</template>
