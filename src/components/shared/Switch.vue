<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";

const v = defineModel<boolean>({ default: false });

const emit = defineEmits<{
  onClick: [];
}>();

const click = () => {
  emit("onClick");
};

const padding = ref(1);
const width = ref(32);
const height = ref(16);
// padding最后都会抵消，所以变成这个公式
const tx = computed(() => width.value - height.value);

const ready = ref(false);

import { useDebounceFn } from "@vueuse/core";

const handle = useDebounceFn(() => {
  ready.value = true;
}, 200);

onMounted(async () => {
  handle();
});
</script>

<template>
  <div
    class="relative rounded-full cursor-pointer"
    :class="v ? 'bg-purple-300' : 'bg-gray-200'"
    :style="{
      width: `${width}px`,
      height: `${height}px`,
      padding: `${padding}px`,
    }"
    @click="click"
  >
    <div
      class="h-full aspect-square bg-white rounded-full"
      :class="ready ? 'duration-200' : ''"
      :style="{
        transform: v ? `translateX(${tx}px)` : 'translateX(0)',
      }"
    ></div>
  </div>
</template>
