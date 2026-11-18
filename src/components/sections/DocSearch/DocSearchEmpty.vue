<template>
  <!-- 搜索无结果：语义区别于空列表，文案保留引导；样式统一走 EmptyHint -->
  <EmptyHint class="h-16 border-t border-gray-100">
    未找到匹配的文档，尝试使用其他关键词搜索。
  </EmptyHint>
</template>

<script setup lang="ts">
import EmptyHint from "@/components/shared/EmptyHint.vue";
</script>
