<script setup lang="ts">
// 元函数：列表空状态占位提示
interface Props {
  text?: string;
}

withDefaults(defineProps<Props>(), {
  text: "暂无内容",
});
</script>
<template>
  <div class="h-20 flex items-center justify-center text-xs text-neutral-400">
    {{ text }}
  </div>
</template>
