<script setup lang="ts">
// 流程图编辑器：基于 silkio-flowchart（便捷模式：只传 canvas，
// 场景自建 App 并安装 @silkor/preset 官方插件，destroy 时对称卸载）。
// 文档 content 为 JSON 字符串，模型与 silkio-flowchart 的 FlowData 一致：
//   { nodes: [{ id, shape, x, y, text }], edges: [{ from, to, text? }] }]
// 顶部工具栏 UI 见 FlowChartToolbar.vue，标题 chip 见 FlowChartTitle.vue。
import { FlowChart, type FlowData, type ShapeKind } from "silkio-flowchart";
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { noteShapes } from "./noteShape";
import FlowChartToolbar from "@/components/sections/FlowChart/FlowChartToolbar.vue";
import FlowChartTitle from "@/components/sections/FlowChart/FlowChartTitle.vue";
import { flowChartAIGenerate } from "@/actions/aiAction";
import { setFlowChartInstance } from "@/actions/canvasRegistry";
import { exportImage } from "@/utils/exportImage";
import { countWords } from "@/utils/text";

const props = defineProps<{ content: string }>();

const emit = defineEmits<{
  onReady: [];
  onContentSave: [content: string, plain_text: string, word_count: number];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const flowchart = shallowRef<FlowChart>();

// 工具栏状态：撤销重做可用性、选中态、缩放百分比
const canUndo = ref(false);
const canRedo = ref(false);
const hasSelection = ref(false);
const zoom = ref(100);

// 解析文档内容，空/损坏数据时回退为空画布
const parseDoc = (raw: string): FlowData => {
  try {
    const parsed = JSON.parse(raw) as Partial<FlowData>;
    if (parsed && Array.isArray(parsed.nodes)) {
      return { nodes: parsed.nodes, edges: parsed.edges ?? [] };
    }
  } catch {
    // 回退空画布
  }
  return { nodes: [], edges: [] };
};

const save = () => {
  const fc = flowchart.value;
  if (!fc) return;
  const data = fc.toJSON();
  const plainText = data.nodes
    .map((n) => n.text ?? "")
    .filter(Boolean)
    .join("\n");
  emit("onContentSave", JSON.stringify(data), plainText, countWords(plainText));
};

// 同步工具栏状态（canUndo/canRedo 为 getter，需在读数时机回填 ref）
const syncState = () => {
  const fc = flowchart.value;
  if (!fc) return;
  canUndo.value = fc.canUndo;
  canRedo.value = fc.canRedo;
  hasSelection.value = fc.hasShapeSelection;
};

const undo = () => {
  flowchart.value?.undo();
  syncState();
};
const redo = () => {
  flowchart.value?.redo();
  syncState();
};

// 在视口中心附近添加形状（参照 demo：中心世界坐标 + 逐次偏移避免完全重叠）
let addJitter = 0;
const addShape = (kind: ShapeKind, text: string) => {
  const fc = flowchart.value;
  const canvas = canvasRef.value;
  if (!fc || !canvas) return;
  const rect = canvas.getBoundingClientRect();
  const center = fc.screenToWorld(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
  );
  const offset = (addJitter++ % 5) * 24 - 48;
  fc.addNode({
    shape: kind,
    text,
    x: center.x - 80 + offset,
    y: center.y - 32 + offset,
  });
};

const replaceShape = (kind: ShapeKind) => {
  flowchart.value?.replaceSelected(kind);
  syncState();
};

const fitView = () => flowchart.value?.fit();
const centerView = () => flowchart.value?.center();

const setZoom = (scale: number) => {
  const fc = flowchart.value;
  if (!fc) return;
  const clamped = Math.min(8, Math.max(0.2, scale));
  fc.setZoom(clamped);
  zoom.value = Math.round(clamped * 100);
};

const zoomIn = () => setZoom((zoom.value + 10) / 100);
const zoomOut = () => setZoom((zoom.value - 10) / 100);

const exportPng = async () => {
  const fc = flowchart.value;
  if (!fc) return;
  try {
    const blob = await fc.toImage({ background: "#ffffff" });
    // 弹原生保存对话框写盘；用户取消返回 false，静默忽略
    await exportImage("flowchart.png", blob);
  } catch (e) {
    console.error(e);
  }
};

let offSelection: (() => void) | null = null;
let offViewport: (() => void) | null = null;

onMounted(async () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  flowchart.value = new FlowChart({
    canvas,
    data: parseDoc(props.content),
    plugins: [noteShapes],
    // AI 生成适配器（参照 .examples/flowchart）：模型只输出语义图，
    // 坐标与端口方向由包内布局器计算，generate 入口整图替换/改图
    ai: flowChartAIGenerate,
    onChange: () => {
      save();
      syncState();
    },
  });
  // 注册活实例：AI 面板（RightBar）经注册表取用 generate 入口
  setFlowChartInstance(flowchart.value);
  offSelection = flowchart.value.onSelectionChange(() => syncState());
  offViewport = flowchart.value.onViewportChange((scale) => {
    zoom.value = Math.round(scale * 100);
  });
  // 渲染文档后自动适应视图（参照 .examples/flowchart 的 fitScene）：只缩小不放大
  // （缩放超过 100% 压回 1），小文档按原尺寸居中；空文档回退居中
  if (flowchart.value.toJSON().nodes.length) {
    flowchart.value.fit();
    if (flowchart.value.zoom > 1) flowchart.value.setZoom(1);
  } else {
    flowchart.value.center();
  }
  zoom.value = Math.round(flowchart.value.zoom * 100);
  syncState();
  // 等首帧绘制提交后再显示窗口，避免白屏闪烁（与 RichText 的就绪信号对齐）
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));
  emit("onReady");
});

onBeforeUnmount(() => {
  setFlowChartInstance(null);
  offSelection?.();
  offViewport?.();
  flowchart.value?.destroy();
  flowchart.value = undefined;
});
</script>

<template>
  <!-- 画布铺满整个区域，工具条悬浮其上（半透明毛玻璃圆角卡片），不再占独立一行 -->
  <div class="relative h-full w-full select-none">
    <div class="absolute inset-0">
      <canvas ref="canvasRef" class="block h-full w-full bg-white"></canvas>
    </div>

    <FlowChartTitle />

    <FlowChartToolbar
      :can-undo="canUndo"
      :can-redo="canRedo"
      :has-selection="hasSelection"
      :zoom="zoom"
      @undo="undo"
      @redo="redo"
      @add-shape="addShape"
      @replace-shape="replaceShape"
      @fit-view="fitView"
      @center-view="centerView"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @set-zoom="setZoom"
      @export-png="exportPng"
    />
  </div>
</template>
