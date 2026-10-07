<script setup lang="ts">
import { Icon } from "@iconify/vue";

// 元函数：编辑器无内容时的空状态占位（如打开归档时尚无可渲染的文档）
interface Props {
  icon?: string;
  text?: string;
}

withDefaults(defineProps<Props>(), {
  icon: "mdi:folder-open-outline",
  text: "打开左侧归档或文档以开始编辑",
});
</script>

<template>
  <div class="w-full h-full grid place-content-center select-none">
    <div class="flex flex-col items-center gap-2 text-neutral-300">
      <Icon :icon="icon" class="w-16 h-16" />
      <div class="text-sm text-neutral-400">{{ text }}</div>
    </div>
  </div>
</template>
