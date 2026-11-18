<script setup lang="ts">
import { computed } from "vue";
import Doc from "@/components/icons/Doc.vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";
import EmptyHint from "@/components/shared/EmptyHint.vue";
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
  <!-- 头部规格与 DocEntries 头部一致：pl-[18px] 使图标左缘落在左栏内容轴上
       （列表 px-2 + 条目 pl-2.5 = 18px），entry/toc 切换时头部不横跳 -->
  <div
    class="h-11 shrink-0 flex items-center pl-[18px] pr-4 gap-1.5 border-b border-gray-100"
  >
    <Doc class="size-4 shrink-0 text-gray-400" />
    <span class="flex-1 min-w-0 truncate">
      {{ editorStore.title || "未命名标题" }}
    </span>
  </div>
  <ScrollArea class="flex-1 min-h-0 px-2 py-2">
    <EmptyHint v-if="richtextStore.toc.length === 0" class="h-11" />
    <a
      :href="`#${item.id}`"
      v-for="item in richtextStore.toc"
      class="block cursor-pointer rounded-md py-1 pr-2 truncate text-sm hover:bg-gray-100"
      :style="{ paddingLeft: indentOf(item.originalLevel) }"
      :class="item.isActive ? 'bg-purple-100 text-purple-700' : ''"
    >
      {{ item.textContent }}
    </a>
  </ScrollArea>
</template>
