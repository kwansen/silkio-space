<script setup lang="ts">
import { computed } from "vue";
import Doc from "@/components/icons/Doc.vue";
import { useEditorStore } from "@/stores/editorStore";
import { useRichtextStore } from "@/stores/richtextStore";
const editorStore = useEditorStore();
const richtextStore = useRichtextStore();

// 层级夯实：将文档中实际出现的标题层级去重排序后压缩为从 1 开始的连续层级。
// 如 {2} → 1；{2,3,4,6} → 1,2,3,4；{1,3,6} → 1,2,3。
// 空缺的 level 由后续层级统一向前补齐，保证缩进无空洞。
const levelRank = computed(() => {
  const levels = [
    ...new Set(richtextStore.toc.map((item) => item.originalLevel)),
  ].sort((a, b) => a - b);
  return new Map(levels.map((level, index) => [level, index + 1]));
});

const indentOf = (level: number) =>
  `${((levelRank.value.get(level) ?? 1) - 1) * 20 + 12}px`;
</script>

<template>
  <div
    class="h-11 shrink-0 flex items-center pl-3 pr-2 gap-1.5 border-b border-gray-100"
  >
    <Doc class="size-4 shrink-0 text-neutral-400" />
    <span class="flex-1 min-w-0 truncate">
      {{ editorStore.title || "未命名标题" }}
    </span>
  </div>
  <div class="flex-1 min-h-0 overflow-y-auto px-2 py-2">
    <div
      v-if="richtextStore.toc.length === 0"
      class="h-11 flex items-center justify-center text-xs text-neutral-400"
    >
      空空如也
    </div>
    <a
      :href="`#${item.id}`"
      v-for="item in richtextStore.toc"
      class="block cursor-pointer rounded-md py-1 pr-2 truncate text-sm hover:bg-gray-100"
      :style="{ paddingLeft: indentOf(item.originalLevel) }"
      :class="item.isActive ? 'bg-purple-100 text-purple-700' : ''"
    >
      {{ item.textContent }}
    </a>
  </div>
</template>
