<script setup lang="ts">
import { computed } from "vue";
import EmptyTip from "@/components/shared/EmptyTip.vue";
import { useEditorViewStore } from "@/stores/editorView";

const store = useEditorViewStore();

// 大纲项：标题层级、文本与出现顺序（用于映射编辑器 DOM 节点）
interface OutlineItem {
  level: number;
  text: string;
  index: number;
}

// 元函数：递归拼接节点文本
const nodeText = (node: any): string => {
  if (typeof node?.text === "string") return node.text;
  if (Array.isArray(node?.content)) return node.content.map(nodeText).join("");
  return "";
};

// 元函数：解析当前富文本文档内容 JSON，按顺序收集标题生成大纲
const outline = computed<OutlineItem[]>(() => {
  const raw = store.doc?.content;
  if (!raw || store.doc?.doc_type !== "richText") return [];
  try {
    const root = JSON.parse(raw);
    const items: OutlineItem[] = [];
    const walk = (node: any) => {
      if (!node) return;
      if (node.type === "heading") {
        items.push({
          level: Number(node.attrs?.level ?? 1),
          text: nodeText(node),
          index: items.length,
        });
      }
      if (Array.isArray(node.content)) node.content.forEach(walk);
    };
    walk(root);
    return items;
  } catch {
    return [];
  }
});

// 元函数：点击大纲项滚动编辑器到对应标题（顺序与内容 JSON 一致）
const scrollToHeading = (index: number) => {
  const nodes = document.querySelectorAll<HTMLElement>(
    ".ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6",
  );
  nodes[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
};
</script>
<template>
  <!-- 当前文档大纲：点击滚动到对应标题 -->
  <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5">
    <EmptyTip v-if="outline.length < 1" text="暂无大纲" />
    <div
      v-for="h in outline"
      :key="h.index"
      class="h-8 flex items-center rounded-md text-xs cursor-pointer select-none shrink-0 text-neutral-600 hover:bg-gray-100"
      :style="{ paddingLeft: `calc(${(h.level - 1) * 12}px + 8px)` }"
      @click="scrollToHeading(h.index)"
    >
      <div class="truncate">{{ h.text || "未命名标题" }}</div>
    </div>
  </div>
</template>
