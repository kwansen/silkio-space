<script setup lang="ts">
import Search from "@/components/icons/Search.vue";
import { useDocSearchStore } from "@/stores/docSearchStore";
import { storeToRefs } from "pinia";
import { onMounted, useTemplateRef, watch } from "vue";

// 输入框引用，用于组件挂载后手动聚焦
const inputRef = useTemplateRef("inputRef");
const store = useDocSearchStore();
const { query } = storeToRefs(store);

onMounted(() => {
  inputRef.value?.focus();
});

// 元函数：关键词变化时立即执行搜索（纯本地应用，无需防抖）
watch(
  () => query.value,
  (v) => {
    if (v) {
      store.searchDocs(v);
    } else {
      store.setDocs([]);
    }
  },
);
</script>

<template>
  <div class="flex h-16">
    <div class="size-16 grid place-items-center">
      <Search class="size-5 text-gray-500" />
    </div>
    <input
      ref="inputRef"
      v-model="query"
      class="h-16 flex-1 bg-white outline-none pr-4"
      type="text"
      placeholder="搜索文档"
    />
  </div>
</template>
