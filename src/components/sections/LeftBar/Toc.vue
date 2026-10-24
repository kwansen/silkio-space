<script setup lang="ts">
import { computed } from "vue";
import Doc from "@/components/icons/Doc.vue";
import { useEditorStore } from "@/stores/editorStore";
const editorStore = useEditorStore();

// 层级夯实：将文档中实际出现的标题层级去重排序后压缩为从 1 开始的连续层级。
// 如 {2} → 1；{2,3,4,6} → 1,2,3,4；{1,3,6} → 1,2,3。
// 空缺的 level 由后续层级统一向前补齐，保证缩进无空洞。
const levelRank = computed(() => {
  const levels = [
    ...new Set(editorStore.toc.map((item) => item.originalLevel)),
  ].sort((a, b) => a - b);
  return new Map(levels.map((level, index) => [level, index + 1]));
});

const indentOf = (level: number) =>
  `${((levelRank.value.get(level) ?? 1) - 1) * 20 + 16}px`;
</script>

<template>
  <div class="h-11 pl-4 flex items-center gap-1 border-b border-purple-300">
    <Doc class="size=5" />
    <span>{{ editorStore.title }}</span>
  </div>
  <div class="h-2"></div>
  <a
    :href="`#${item.id}`"
    v-for="item in editorStore.toc"
    class="block cursor-pointer py-0.5"
    :style="{ paddingLeft: indentOf(item.originalLevel) }"
    :class="item.isActive ? 'text-purple-700' : ''"
  >
    {{ item.textContent }}
  </a>
</template>
