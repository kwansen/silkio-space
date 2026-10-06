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

// 合并基础样式与外部传入的 class
const rootClass = computed(() => {
  const base = "select-none transition-colors duration-200";
  return twMerge(clsx(base, attrs.class));
});
</script>

<template>
  <button v-bind="attrsWithoutClass" :class="rootClass">
    <slot />
  </button>
</template>
