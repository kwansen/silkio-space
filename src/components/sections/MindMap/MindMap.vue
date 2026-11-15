<script setup lang="ts">
// 思维导图编辑器：基于 silkio-mindmap（@silkor/core 画布引擎）。
// 文档 content 为 JSON 字符串，模型与 silkio-mindmap 的 MindMapNode 一致：
//   { text: string, children: MindMapNode[] }
// 装配为 starter-kit 模式：宿主自建 App 并安装 @silkor/preset 官方插件，
// 场景包只补自有插件（BuiltinTreeLayout 等）。
import { App } from "@silkor/core";
import { officialPlugins } from "@silkor/preset";
import { MindMap, type MindMapNode } from "silkio-mindmap";
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";

const props = defineProps<{ content: string }>();

const emit = defineEmits<{
  onReady: [];
  onContentSave: [content: string, plain_text: string, word_count: number];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const app = shallowRef<App>();
const mindmap = shallowRef<MindMap>();

// 解析文档内容，空/损坏数据时回退为仅含根节点的默认树
const parseDoc = (raw: string): MindMapNode => {
  try {
    const parsed = JSON.parse(raw) as MindMapNode;
    if (parsed && typeof parsed.text === "string") return parsed;
  } catch {
    // 回退默认树
  }
  return { text: "中心主题", children: [] };
};

// 汇总整棵树的纯文本与字数
const collectText = (node: MindMapNode, out: string[] = []): string[] => {
  if (node.text) out.push(node.text);
  for (const child of node.children ?? []) collectText(child, out);
  return out;
};

const save = () => {
  const mm = mindmap.value;
  if (!mm) return;
  const doc = mm.toJSON();
  const plainText = collectText(doc).join("\n");
  emit(
    "onContentSave",
    JSON.stringify(doc),
    plainText,
    plainText.replace(/\s/g, "").length,
  );
};

onMounted(async () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  app.value = new App(canvas);
  for (const plugin of officialPlugins()) app.value.use(plugin);
  mindmap.value = new MindMap({
    app: app.value,
    data: parseDoc(props.content),
    direction: "right",
    onChange: save,
  });
  // init 是异步的：selectRoot 落定即场景就绪，fit 后再显示窗口避免白屏闪烁
  await mindmap.value.selectRoot();
  mindmap.value.fit();
  emit("onReady");
});

onBeforeUnmount(() => {
  mindmap.value?.destroy();
  mindmap.value = undefined;
  app.value = undefined;
});
</script>

<template>
  <canvas ref="canvasRef" class="block h-full w-full bg-white"></canvas>
</template>
