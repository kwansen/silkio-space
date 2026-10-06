<script setup lang="ts">
import MindMap from "simple-mind-map";
import { onMounted, useTemplateRef } from "vue";
import { useEditorViewStore } from "@/stores/editorView";

const emit = defineEmits<{ onReady: [] }>();

const mindmapRef = useTemplateRef("mindmapRef");

const store = useEditorViewStore();

// 元函数：从当前文档内容解析思维导图数据（解析失败时使用默认根节点）
const resolveData = () => {
  const content = store.doc?.content;
  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      // 内容非合法 JSON 时回退默认根节点
    }
  }
  return { data: { text: "根节点" }, children: [] };
};

let mindMap: MindMap | null = null;
onMounted(() => {
  if (!mindmapRef.value) return;
  mindMap = new MindMap({
    el: mindmapRef.value,
    data: resolveData(),
  });
  emit("onReady");
});
</script>
<template>
  <div ref="mindmapRef" class="w-full h-full"></div>
</template>
