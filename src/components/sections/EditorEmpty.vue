<script setup lang="ts">
import { onMounted } from "vue";
const emit = defineEmits<{
  onReady: [];
}>();

onMounted(async () => {
  emit("onReady");
});
</script>

<template>
  <div class="w-full h-full grid place-items-center text-4xl text-neutral-400">
    空
  </div>
</template>
