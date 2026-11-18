<script setup lang="ts">
// 流程图编辑器：基于 silkio-flowchart（便捷模式：只传 canvas，
// 场景自建 App 并安装 @silkor/preset 官方插件，destroy 时对称卸载）。
// 文档 content 为 JSON 字符串，模型与 silkio-flowchart 的 FlowData 一致：
//   { nodes: [{ id, shape, x, y, text }], edges: [{ from, to, text? }] }
// 顶部工具栏参照 .examples/demo-flowchart：撤销重做/形状增删替换/删除/
// 适应居中/缩放/导出图片。添加与替换走图标按钮 + 形状图标网格菜单（7 种形状，
// 含经 noteShapes 插件注册的便签）。
import { FlowChart, type FlowData, type ShapeKind } from "silkio-flowchart";
import { onClickOutside } from "@vueuse/core";
import { onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from "vue";
import Delete from "@/components/icons/Delete.vue";
import Maximize from "@/components/icons/Maximize.vue";
import PlusBox from "@/components/icons/PlusBox.vue";
import Redo from "@/components/icons/Redo.vue";
import Swap from "@/components/icons/Swap.vue";
import Undo from "@/components/icons/Undo.vue";
import ShapeIcon from "./ShapeIcon.vue";
import { noteShapes } from "./noteShape";
import { useEditorAction } from "@/actions/editorAction";
import { useEditorStore } from "@/stores/editorStore";
import { exportImage } from "@/utils/exportImage";
import { countWords } from "@/utils/text";

const props = defineProps<{ content: string }>();

const emit = defineEmits<{
  onReady: [];
  onContentSave: [content: string, plain_text: string, word_count: number];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const flowchart = shallowRef<FlowChart>();

// 文档标题：画布内容无天然标题节点（不像 MindMap 的根节点），由用户独立编辑
const editorStore = useEditorStore();
const { setDocTitle } = useEditorAction();
const onTitleInput = (e: Event) => {
  setDocTitle((e.target as HTMLInputElement).value);
};

// 工具栏状态：撤销重做可用性、选中态、缩放百分比
const canUndo = ref(false);
const canRedo = ref(false);
const hasSelection = ref(false);
const zoom = ref(100);

// 内置形状清单（label 用于 tooltip，text 为新节点默认文案），
// note 由 noteShapes 插件注册，与 .examples/flowchart 的 shapeOptions 一致共 7 种
const SHAPE_OPTIONS: { kind: ShapeKind; label: string; text: string }[] = [
  { kind: "rect", label: "矩形 · 步骤", text: "新步骤" },
  { kind: "diamond", label: "菱形 · 判断", text: "新判断" },
  { kind: "ellipse", label: "椭圆 · 起止", text: "新端点" },
  { kind: "parallelogram", label: "平行四边形 · 输入输出", text: "输入数据" },
  { kind: "hexagon", label: "六边形 · 准备", text: "准备阶段" },
  { kind: "database", label: "数据库 · 存储", text: "存储数据" },
  { kind: "note", label: "便签 · 自定义形状", text: "便签" },
];

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
  emit(
    "onContentSave",
    JSON.stringify(data),
    plainText,
    countWords(plainText),
  );
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

const removeSelected = () => {
  flowchart.value?.deleteSelected();
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

// 下拉菜单开关与外点关闭
const shapeMenuOpen = ref(false);
const replaceMenuOpen = ref(false);
const shapeMenuRef = useTemplateRef<HTMLDivElement>("shapeMenuRef");
const replaceMenuRef = useTemplateRef<HTMLDivElement>("replaceMenuRef");
onClickOutside(shapeMenuRef, () => (shapeMenuOpen.value = false));
onClickOutside(replaceMenuRef, () => (replaceMenuOpen.value = false));

let offSelection: (() => void) | null = null;
let offViewport: (() => void) | null = null;

onMounted(async () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  flowchart.value = new FlowChart({
    canvas,
    data: parseDoc(props.content),
    plugins: [noteShapes],
    onChange: () => {
      save();
      syncState();
    },
  });
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
    <!-- 文档标题：左上角浮动 chip，样式与工具条一致 -->
    <div
      class="absolute top-2 left-2 z-10 flex items-center h-8 px-2 bg-white/85 backdrop-blur-md rounded-lg shadow-lg"
    >
      <input
        class="w-36 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300 cursor-text"
        :value="editorStore.title"
        placeholder="未命名标题"
        title="文档标题"
        @input="onTitleInput"
      />
    </div>
    <div
      class="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 px-2 py-1 bg-white/85 backdrop-blur-md rounded-lg shadow-lg text-gray-700"
    >
      <button
        class="size-7 grid place-items-center rounded-md cursor-pointer hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="!canUndo"
        title="撤销"
        @click="undo"
      >
        <Undo class="size-4" />
      </button>
      <button
        class="size-7 grid place-items-center rounded-md cursor-pointer hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="!canRedo"
        title="重做"
        @click="redo"
      >
        <Redo class="size-4" />
      </button>

      <div class="w-px h-5 bg-gray-200 mx-1.5"></div>

      <!-- 添加形状：图标触发 + 形状图标网格（每行 4 个自动换行，悬停 tooltip 提示名称） -->
      <div ref="shapeMenuRef" class="relative">
        <button
          class="size-7 grid place-items-center rounded-md cursor-pointer hover:bg-gray-200"
          title="添加形状"
          @click="shapeMenuOpen = !shapeMenuOpen"
        >
          <PlusBox class="size-4" />
        </button>
        <div
          v-if="shapeMenuOpen"
          class="absolute top-full left-0 mt-1.5 z-10 flex flex-row flex-wrap w-60 gap-0.5 p-1 bg-white rounded-[10px] shadow-2xl before:absolute before:-top-1.5 before:left-0 before:right-0 before:h-1.5 before:content-['']"
        >
          <button
            v-for="s in SHAPE_OPTIONS"
            :key="s.kind"
            type="button"
            class="h-14 w-14 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-violet-500"
            :title="s.label"
            @click="
              addShape(s.kind, s.text);
              shapeMenuOpen = false;
            "
          >
            <ShapeIcon :kind="s.kind" class="w-10 h-6" />
          </button>
        </div>
      </div>

      <!-- 替换选中形状：无选中时禁用（与撤销/重做同一禁用样式） -->
      <div ref="replaceMenuRef" class="relative">
        <button
          class="size-7 grid place-items-center rounded-md cursor-pointer hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="!hasSelection"
          title="替换选中形状"
          @click="replaceMenuOpen = !replaceMenuOpen"
        >
          <Swap class="size-4" />
        </button>
        <div
          v-if="replaceMenuOpen"
          class="absolute top-full left-0 mt-1.5 z-10 flex flex-row flex-wrap w-60 gap-0.5 p-1 bg-white rounded-[10px] shadow-2xl before:absolute before:-top-1.5 before:left-0 before:right-0 before:h-1.5 before:content-['']"
        >
          <button
            v-for="s in SHAPE_OPTIONS"
            :key="s.kind"
            type="button"
            class="h-14 w-14 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-violet-500"
            :title="s.label"
            @click="
              replaceShape(s.kind);
              replaceMenuOpen = false;
            "
          >
            <ShapeIcon :kind="s.kind" class="w-10 h-6" />
          </button>
        </div>
      </div>

      <button
        class="size-7 grid place-items-center rounded-md cursor-pointer hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="!hasSelection"
        title="删除选中"
        @click="removeSelected"
      >
        <Delete class="size-4" />
      </button>

      <div class="w-px h-5 bg-gray-200 mx-1.5"></div>

      <button
        class="size-7 grid place-items-center rounded-md cursor-pointer hover:bg-gray-200"
        title="适应视图"
        @click="fitView"
      >
        <Maximize class="size-4" />
      </button>
      <button
        class="size-7 grid place-items-center rounded-md cursor-pointer hover:bg-gray-200"
        title="居中"
        @click="centerView"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="0.6"
          stroke-linecap="round"
          class="size-4"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>

      <div class="w-px h-5 bg-gray-200 mx-1.5"></div>

      <button
        class="w-7 h-7 grid place-items-center rounded-md cursor-pointer hover:bg-gray-200"
        title="缩小"
        @click="zoomOut"
      >
        <span class="text-sm leading-none">−</span>
      </button>
      <span class="w-10 text-center text-xs tabular-nums">{{ zoom }}%</span>
      <button
        class="w-7 h-7 grid place-items-center rounded-md cursor-pointer hover:bg-gray-200"
        title="放大"
        @click="zoomIn"
      >
        <span class="text-sm leading-none">+</span>
      </button>

      <div class="flex-1"></div>

      <button
        class="h-7 px-2 flex items-center gap-1 rounded-md cursor-pointer hover:bg-gray-200 text-xs"
        title="导出 PNG"
        @click="exportPng"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="0.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
        >
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M4 21h16" />
        </svg>
        导出
      </button>
    </div>
  </div>
</template>
