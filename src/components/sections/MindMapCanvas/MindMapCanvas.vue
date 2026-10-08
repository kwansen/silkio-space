<script setup lang="ts">
import MindMap from "simple-mind-map";
import { onMounted, onBeforeUnmount, useTemplateRef } from "vue";
import { useEditorViewStore } from "@/stores/editorView";
import { useDoc } from "@/composables/useDocuments.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";

// 思维导图节点结构（simple-mind-map 无类型定义，此处自行声明所需字段）
interface MindNode {
  data?: { text?: string };
  children?: MindNode[];
}

const emit = defineEmits<{ onReady: [] }>();

const mindmapRef = useTemplateRef("mindmapRef");

const store = useEditorViewStore();
const { updateContent } = useDoc();

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

// 元函数：遍历导图树收集节点文本，作为文档纯文本（供搜索与列表摘要使用）
const collectTexts = (node: MindNode): string[] => {
  const texts = [node.data?.text ?? ""];
  for (const child of node.children ?? []) texts.push(...collectTexts(child));
  return texts;
};

// 元函数：导图数据变化时保存 JSON 内容与纯文本，并通知 main 窗口刷新列表
const handleDataChange = (data: { data: MindNode["data"]; children: MindNode[] }) => {
  const doc = store.doc;
  if (!doc?.id) return;
  const content = JSON.stringify(data);
  const plainText = collectTexts(data).join("\n");
  // 元函数：数据变化时同步到编辑视图 store，保持侧栏标题与摘要实时更新
  doc.content = content;
  doc.plain_text = plainText;
  updateContent(doc.id, content, plainText).then(notifyMainRefresh).catch(console.error);
};

let mindMap: MindMap | null = null;
onMounted(() => {
  if (!mindmapRef.value) return;
  mindMap = new MindMap({
    el: mindmapRef.value,
    data: resolveData(),
  });
  mindMap.on("data_change", handleDataChange);
  emit("onReady");
});

onBeforeUnmount(() => {
  mindMap?.off("data_change", handleDataChange);
  mindMap?.destroy();
});
</script>
<template>
  <div ref="mindmapRef" class="w-full h-full"></div>
</template>
