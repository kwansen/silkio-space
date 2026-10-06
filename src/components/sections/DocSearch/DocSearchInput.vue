<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";

// 输入框引用，用于组件挂载后手动聚焦
const inputRef = useTemplateRef("inputRef");

onMounted(() => {
  inputRef.value?.focus();
});
</script>

<template>
  <input
    ref="inputRef"
    class="mb-1 h-14 w-full bg-white ring ring-gray-300 outline-none focus:ring-purple-400 px-4"
    type="text" />
</template>
