<script setup lang="ts">
import { useArchiveSortAction } from "@/actions/archiveSort";
import { useArchiveSortStore } from "@/stores/archiveSortStore";
import { storeToRefs } from "pinia";
import { onMounted, useTemplateRef, watch } from "vue";

// 输入框引用，用于组件挂载后手动聚焦
const inputRef = useTemplateRef("inputRef");
const store = useArchiveSortStore();
const { query } = storeToRefs(store);
const action = useArchiveSortAction();

onMounted(() => {
  inputRef.value?.focus();
});

// 元函数：关键词变化时立即执行搜索（纯本地应用，无需防抖）
// watch(
//   () => query.value,
//   (v) => {
//     if (v) {
//       action.search(v);
//     } else {
//       store.setSearchedArchives([]);
//     }
//   },
// );
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
