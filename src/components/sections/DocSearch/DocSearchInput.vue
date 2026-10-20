<script setup lang="ts">
import { useDocAction } from "@/actions/docAction";
import { useDocSearchStore } from "@/stores/docSearchStore";
import { storeToRefs } from "pinia";
import { onMounted, ref, useTemplateRef, watch } from "vue";

// 输入框引用，用于组件挂载后手动聚焦
const inputRef = useTemplateRef("inputRef");
const store = useDocSearchStore();
const { query } = storeToRefs(store);
const action = useDocAction();

onMounted(() => {
  inputRef.value?.focus();
});

// 元函数：关键词变化时立即执行搜索（纯本地应用，无需防抖）
watch(
  () => query.value,
  (v) => {
    if (v) {
      action.searchDocs(v);
    } else {
      store.setDocs([]);
    }
  },
);
</script>

<template>
  <input
    ref="inputRef"
    v-model="query"
    class="mb-1 h-14 w-full bg-white ring ring-gray-300 outline-none focus:ring-purple-400 px-4"
    type="text"
    placeholder="搜索文档标题与内容"
  />
</template>
