<script setup lang="ts">
import { Icon, IconifyIcon } from "@iconify/vue";

export interface PopoverItem {
  icon: string | IconifyIcon;
  name: string;
  // key：由列表组件注入的当前条目 key（无上下文时可忽略该参数）
  action: (key?: number | string | null) => void;
}

interface Props {
  list: PopoverItem[];
}

defineProps<Props>();
</script>

<template>
  <div class="bg-white rounded-md shadow-lg p-1 z-10 select-none">
    <div
      v-for="item in list"
      class="w-full py-2 hover:bg-gray-100 flex items-center gap-2 px-4 text-xs"
      @click="item.action()">
      <Icon :icon="item.icon" class="w-5 h-5 text-neutral-500" />
      <div>{{ item.name }}</div>
    </div>
  </div>
</template>
