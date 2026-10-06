<script setup lang="ts">
import { Icon, IconifyIcon } from "@iconify/vue";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { computed, useAttrs } from "vue";

defineOptions({
  inheritAttrs: false,
});

interface Props {
  icon: string | IconifyIcon;
  iconClass?: string;
}

const props = defineProps<Props>();

const attrs = useAttrs();

const attrsWithoutClass = computed(() => {
  const { class: _cls, ...rest } = attrs;
  return rest;
});

const rootClass = computed(() => {
  const base =
    "w-10 h-10 grid place-content-center transition-colors duration-200 select-none";
  const allClasses = clsx(base, attrs.class);
  return twMerge(allClasses);
});
</script>

<template>
  <div v-bind="attrsWithoutClass" :class="rootClass">
    <Icon :icon="icon" :class="iconClass" />
  </div>
</template>
