<script setup lang="ts">
import Search from "@/components/icons/Search.vue";
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
  <div class="h-16 flex">
    <div class="size-16 grid place-items-center">
      <Search class="size-5" />
    </div>

    <input
      ref="inputRef"
      v-model="query"
      class="flex-1 outline-none pr-4"
      type="text"
      placeholder="搜索归档"
    />
  </div>
</template>
