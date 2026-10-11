<script setup lang="ts">
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { computed, useAttrs } from "vue";

defineOptions({
  inheritAttrs: false,
});

const attrs = useAttrs();

const attrsWithoutClass = computed(() => {
  const { class: _cls, ...rest } = attrs;
  return rest;
});

const rootClass = computed(() => {
  const base =
    "w-10 h-10 grid place-content-center transition-colors select-none";
  const allClasses = clsx(base, attrs.class);
  return twMerge(allClasses);
});
</script>

<template>
  <div v-bind="attrsWithoutClass" :class="rootClass">
    <slot/>
  </div>
</template>
