<script setup lang="ts">
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { computed, useAttrs } from "vue";

defineOptions({
  inheritAttrs: false,
});

const attrs = useAttrs();

// 过滤 class 属性，避免与 rootClass 合并冲突
const attrsWithoutClass = computed(() => {
  const { class: _cls, ...rest } = attrs;
  return rest;
});

// 合并基础样式与外部传入的 class；button 的 UA 样式默认箭头光标，
// 这里显式给手型（调用方可用 cursor-* 类覆盖）
const rootClass = computed(() => {
  const base = "select-none cursor-pointer transition-colors duration-200";
  return twMerge(clsx(base, attrs.class));
});
</script>

<template>
  <button v-bind="attrsWithoutClass" :class="rootClass">
    <slot />
  </button>
</template>
