<script setup lang="ts">
import { computed, ref } from "vue";

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
const tx = computed(() => width.value - height.value);
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
      class="h-full aspect-square bg-white rounded-full transition duration-200"
      :style="{ transform: v ? `translateX(${tx}px)` : '' }"
    ></div>
  </div>
</template>
