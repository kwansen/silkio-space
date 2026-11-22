<script setup lang="ts">
// 思维导图编辑器：基于 silkio-mindmap（@silkor/core 画布引擎）。
// 文档 content 为 JSON 字符串，模型与 silkio-mindmap 的 MindMapNode 一致：
//   { text: string, children: MindMapNode[] }
// 装配为 starter-kit 模式：宿主自建 App 并安装 @silkor/preset 官方插件，
// 场景包只补自有插件（BuiltinTreeLayout 等）。
// 工具栏 UI 见 MindMapToolbar.vue，文档解析/序列化见 mindMapDoc.ts。
import { App } from "@silkor/core";
import { officialPlugins } from "@silkor/preset";
import { MindMap } from "silkio-mindmap";
import type { EdgeShape } from "@silkor/core";
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import {
  collectText,
  LEVEL_STYLES,
  parseContent,
  type LayoutDirection,
} from "@/components/sections/MindMap/mindMapDoc";
import MindMapToolbar from "@/components/sections/MindMap/MindMapToolbar.vue";
import { useEditorAction } from "@/actions/editorAction";
import { mindMapAIGenerate } from "@/actions/aiAction";
import { setMindMapInstance } from "@/actions/canvasRegistry";
import { exportImage } from "@/utils/exportImage";
import { countWords } from "@/utils/text";

const props = defineProps<{ content: string }>();

const emit = defineEmits<{
  onReady: [];
  onContentSave: [content: string, plain_text: string, word_count: number];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const app = shallowRef<App>();
const mindmap = shallowRef<MindMap>();

// 工具栏状态：撤销重做可用性、缩放百分比、布局方向与连线样式
const canUndo = ref(false);
const canRedo = ref(false);
const zoom = ref(100);
const direction = ref<LayoutDirection>("right");
const edgeShape = ref<EdgeShape>("rPath");

// 根节点文本即文档标题（参照 .examples/mindmap 的 docName = toJSON().text）：
// 走统一的 setDocTitle 落库链路（防抖 + 快照去重），并实时同步左侧目录
const { setDocTitle } = useEditorAction();
const syncTitle = (rootText: string) => {
  // 根节点文本清空的瞬间不回写，避免把文档标题清掉
  if (!rootText.trim()) return;
  setDocTitle(rootText);
};

const save = () => {
  const mm = mindmap.value;
  if (!mm) return;
  const doc = mm.toJSON();
  const plainText = collectText(doc).join("\n");
  // 根节点文本同步为文档标题
  syncTitle(doc.text);
  // 偏好（方向/连线样式）与数据树并列持久化（toJSON 不含样式信息）
  const saved = {
    data: doc,
    direction: direction.value,
    edgeStyle: edgeShape.value,
  };
  emit(
    "onContentSave",
    JSON.stringify(saved),
    plainText,
    countWords(plainText),
  );
};

// 同步工具栏状态（canUndo/canRedo 为 getter，需在读数时机回填 ref）
const syncState = () => {
  const mm = mindmap.value;
  if (!mm) return;
  canUndo.value = mm.canUndo;
  canRedo.value = mm.canRedo;
};

const undo = async () => {
  await mindmap.value?.undo();
  syncState();
};
const redo = async () => {
  await mindmap.value?.redo();
  syncState();
};

const setLayout = async (value: LayoutDirection) => {
  direction.value = value;
  await mindmap.value?.setLayout(value);
  syncState();
};
const setEdgeStyle = (shape: EdgeShape) => {
  edgeShape.value = shape;
  mindmap.value?.setEdgeStyle(shape);
};
const collapseOthers = async () => {
  await mindmap.value?.collapseOthers();
  syncState();
};
const expandAll = async () => {
  await mindmap.value?.expandAll();
  syncState();
};

// 以画布中心为锚点设置缩放（缩放前后画布中心指向同一世界坐标，画面不跳动）
const setZoom = (scale: number) => {
  const canvas = canvasRef.value;
  const camera = app.value?.camera;
  if (!canvas || !camera) return;
  const rect = canvas.getBoundingClientRect();
  const viewport = camera.viewport;
  const worldX = (rect.width / 2 - viewport.x) / viewport.scale;
  const worldY = (rect.height / 2 - viewport.y) / viewport.scale;
  camera.setViewport({
    x: rect.width / 2 - worldX * scale,
    y: rect.height / 2 - worldY * scale,
    scale,
  });
  app.value?.requestCameraRender();
};

const zoomIn = () => setZoom((zoom.value + 10) / 100);
const zoomOut = () => setZoom((zoom.value - 10) / 100);

// 工具栏手动「适应视图」：真实拟合，允许放大（参照 .examples/mindmap 的 fit）
const fitView = () => mindmap.value?.fit();

// 渲染文档后自动适应视图（参照 .examples/mindmap 的 fitScene）：只缩小不放大，
// 缩放被 fit 抬高超过 100% 时压回 1，节点少的小导图按原尺寸居中即可
const fitScene = () => {
  const mm = mindmap.value;
  if (!mm) return;
  mm.fit();
  if ((app.value?.camera.scale ?? 1) > 1) setZoom(1);
};

const centerView = () => mindmap.value?.center();

const exportPng = async () => {
  const mm = mindmap.value;
  if (!mm) return;
  try {
    const blob = await mm.toImage({ background: "#ffffff" });
    // 弹原生保存对话框写盘；用户取消返回 false，静默忽略
    await exportImage("mindmap.png", blob);
  } catch (e) {
    console.error(e);
  }
};

let offViewport: (() => void) | null = null;

onMounted(async () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  app.value = new App(canvas);
  for (const plugin of officialPlugins()) app.value.use(plugin);
  const parsed = parseContent(props.content);
  direction.value = parsed.direction;
  edgeShape.value = parsed.edgeStyle;
  mindmap.value = new MindMap({
    app: app.value,
    data: parsed.data,
    direction: parsed.direction,
    edgeStyle: parsed.edgeStyle,
    levelStyles: LEVEL_STYLES,
    // AI 编辑适配器（参照 .examples/mindmap）：指令经 ai.run 直接改图，
    // 模型输出由包内 AIEditingController 容错解析，操作原子可撤销
    ai: mindMapAIGenerate,
    onChange: () => {
      save();
      syncState();
    },
  });
  // 注册活实例：AI 面板（RightBar）经注册表取用 ai 控制器
  setMindMapInstance(mindmap.value);
  offViewport = app.value.camera.onViewportChange(() => {
    zoom.value = Math.round((app.value?.camera.scale ?? 1) * 100);
  });
  // init 是异步的：selectRoot 落定即场景就绪，适应视图后再显示窗口避免白屏闪烁
  await mindmap.value.selectRoot();
  fitScene();
  syncState();
  // 挂载即同步根节点文本为标题（无编辑动作时 title 也跟随根节点）
  syncTitle(mindmap.value.toJSON().text);
  emit("onReady");
});

onBeforeUnmount(() => {
  setMindMapInstance(null);
  offViewport?.();
  mindmap.value?.destroy();
  mindmap.value = undefined;
  app.value = undefined;
});
</script>

<template>
  <!-- 画布铺满整个区域，工具条悬浮其上（半透明毛玻璃圆角卡片），不再占独立一行 -->
  <div class="relative h-full w-full select-none">
    <div class="absolute inset-0">
      <canvas ref="canvasRef" class="block h-full w-full bg-white"></canvas>
    </div>

    <MindMapToolbar
      :can-undo="canUndo"
      :can-redo="canRedo"
      :zoom="zoom"
      :direction="direction"
      :edge-shape="edgeShape"
      @undo="undo"
      @redo="redo"
      @set-layout="setLayout"
      @set-edge-style="setEdgeStyle"
      @collapse-others="collapseOthers"
      @expand-all="expandAll"
      @fit-view="fitView"
      @center-view="centerView"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @set-zoom="setZoom"
      @export-png="exportPng"
    />
  </div>
</template>
