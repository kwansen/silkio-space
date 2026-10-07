<script setup lang="ts">
import { ref } from "vue";

type View = "list" | "outline";

const views: { key: View; label: string }[] = [
  { key: "list", label: "列表" },
  { key: "outline", label: "大纲" },
];

const active = ref<View>("list");
</script>

<template>
  <div
    class="h-10 px-2 flex items-center gap-1 select-none"
    style="-webkit-app-region: no-drag"
  >
    <div
      v-for="view in views"
      :key="view.key"
      class="h-7 px-3 flex items-center rounded-md text-xs cursor-pointer transition-colors duration-200"
      :class="
        active === view.key
          ? 'bg-gray-100 text-neutral-700'
          : 'text-gray-400 hover:bg-gray-100 hover:text-neutral-700'
      "
      @click="active = view.key"
    >
      {{ view.label }}
    </div>
  </div>
</template>
