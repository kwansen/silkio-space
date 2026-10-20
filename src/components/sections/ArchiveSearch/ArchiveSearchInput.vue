<script setup lang="ts">
import { useArchiveStore } from "@/stores/archiveStore";
import { storeToRefs } from "pinia";
import { onMounted, useTemplateRef } from "vue";

const inputRef = useTemplateRef("inputRef");
const store = useArchiveStore();
const { query } = storeToRefs(store);

onMounted(() => {
  inputRef.value?.focus();
});
</script>

<template>
  <input
    ref="inputRef"
    v-model="query"
    class="mb-1 h-14 w-full bg-white ring ring-gray-300 outline-none focus:ring-purple-400 px-4"
    type="text"
    placeholder="搜索归档"
  />
</template>
