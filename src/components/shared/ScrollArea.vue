<script setup lang="ts">
import "overlayscrollbars/overlayscrollbars.css";
import { OverlayScrollbarsComponent } from "overlayscrollbars-vue";

defineOptions({
  inheritAttrs: false, // 关闭自动继承，手动控制
});
</script>

<template>
  <OverlayScrollbarsComponent 
    defer 
    v-bind="$attrs"
    :class="['w-full', 'h-full', $attrs.class]"
  >
    <slot />
  </OverlayScrollbarsComponent>
</template>