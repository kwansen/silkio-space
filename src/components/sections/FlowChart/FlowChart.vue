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
import {
  computed,
  type Component,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from "vue";
import Redo from "@/components/icons/Redo.vue";
import Swap from "@/components/icons/Swap.vue";
import Undo from "@/components/icons/Undo.vue";
import { noteShapes } from "./noteShape";
import { useEditorAction } from "@/actions/editorAction";
import { flowChartAIGenerate } from "@/actions/aiAction";
import { setFlowChartInstance } from "@/actions/canvasRegistry";
import { useEditorStore } from "@/stores/editorStore";
import { useHoverMenu } from "@/utils/toolbarMenu";
import { exportImage } from "@/utils/exportImage";
import { countWords } from "@/utils/text";
import Pencil from "@/components/icons/Pencil.vue";
import Plus from "@/components/icons/Plus.vue";
import Focus from "@/components/icons/Focus.vue";
import Aiming from "@/components/icons/Aiming.vue";
import ZoomIn from "@/components/icons/ZoomIn.vue";
import ZoomOut from "@/components/icons/ZoomOut.vue";
import Download from "@/components/icons/Download.vue";
import Rect from "@/components/icons/Rect.vue";
import Diamond from "@/components/icons/Diamond.vue";
import Ellipse from "@/components/icons/Ellipse.vue";
import Parallelogram from "@/components/icons/Parallelogram.vue";
import Hexagon from "@/components/icons/Hexagon.vue";
import Cylinder from "@/components/icons/Cylinder.vue";
import Memo from "@/components/icons/Memo.vue";

const props = defineProps<{ content: string }>();

const emit = defineEmits<{
  onReady: [];
  onContentSave: [content: string, plain_text: string, word_count: number];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const flowchart = shallowRef<FlowChart>();

// 文档标题：画布内容无天然标题节点（不像 MindMap 的根节点），由用户独立编辑。
// 默认只读展示，点铅笔按钮进入编辑态；回车/失焦保存，Esc 取消。
// 输入过程中实时同步 store.title 与左侧目录条目（与 RichText/MindMap 行为一致）
const editorStore = useEditorStore();
const { setDocTitle } = useEditorAction();
const titleEditing = ref(false);
const titleDraft = ref("");
const titleBeforeEdit = ref("");
const titleInputRef = useTemplateRef<HTMLInputElement>("titleInputRef");
const startTitleEdit = () => {
  titleBeforeEdit.value = editorStore.title;
  titleDraft.value = editorStore.title;
  titleEditing.value = true;
  nextTick(() => titleInputRef.value?.select());
};
const onTitleInput = () => {
  setDocTitle(titleDraft.value);
};
const commitTitleEdit = () => {
  if (!titleEditing.value) return;
  titleEditing.value = false;
  setDocTitle(titleDraft.value);
};
const cancelTitleEdit = () => {
  if (titleDraft.value !== titleBeforeEdit.value) {
    setDocTitle(titleBeforeEdit.value);
  }
  titleEditing.value = false;
};
const onTitleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    e.preventDefault();
    commitTitleEdit();
  } else if (e.key === "Escape") {
    cancelTitleEdit();
  }
};

// 工具栏状态：撤销重做可用性、选中态、缩放百分比
const canUndo = ref(false);
const canRedo = ref(false);
const hasSelection = ref(false);
const zoom = ref(100);

// 内置形状清单（label 用于 tooltip，text 为新节点默认文案），
// note 由 noteShapes 插件注册，与 .examples/flowchart 的 shapeOptions 一致共 7 种
const SHAPE_OPTIONS: {
  kind: ShapeKind;
  label: string;
  short: string;
  text: string;
}[] = [
  { kind: "rect", label: "矩形 · 步骤", short: "矩形", text: "新步骤" },
  { kind: "diamond", label: "菱形 · 判断", short: "菱形", text: "新判断" },
  { kind: "ellipse", label: "椭圆 · 起止", short: "椭圆", text: "新端点" },
  {
    kind: "parallelogram",
    label: "平行四边形 · 输入输出",
    short: "平行四边形",
    text: "输入数据",
  },
  {
    kind: "hexagon",
    label: "六边形 · 准备",
    short: "六边形",
    text: "准备阶段",
  },
  {
    kind: "database",
    label: "数据库 · 存储",
    short: "数据库",
    text: "存储数据",
  },
  { kind: "note", label: "便签 · 自定义形状", short: "便签", text: "便签" },
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

// 形状 → 菜单图标的映射（database 对应圆柱图标，note 对应便签图标）
const SHAPE_ICONS: Record<ShapeKind, Component> = {
  rect: Rect,
  diamond: Diamond,
  ellipse: Ellipse,
  parallelogram: Parallelogram,
  hexagon: Hexagon,
  database: Cylinder,
  note: Memo,
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

// 缩放滑块轨道填充：左侧紫色已填充段，右侧浅色剩余段
const zoomTrackStyle = computed(() => {
  const value = Math.min(800, Math.max(20, zoom.value));
  const fill = ((value - 20) / (800 - 20)) * 100;
  return {
    background: `linear-gradient(to right, #8b5cf6 ${fill}%, #e5e7eb ${fill}%)`,
  };
});
const onZoomInput = (event: Event) => {
  setZoom(Number((event.target as HTMLInputElement).value) / 100);
};

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

// 悬浮面板（hover intent）：延迟展开/移出即收/点击切换；外点关闭兜底
const { openMenu, scheduleMenu, closeMenu, toggleMenu } = useHoverMenu();
const shapeMenuRef = useTemplateRef<HTMLDivElement>("shapeMenuRef");
const replaceMenuRef = useTemplateRef<HTMLDivElement>("replaceMenuRef");
const zoomMenuRef = useTemplateRef<HTMLDivElement>("zoomMenuRef");
onClickOutside(shapeMenuRef, closeMenu);
onClickOutside(replaceMenuRef, closeMenu);
onClickOutside(zoomMenuRef, closeMenu);

// 选中被清空（点画布空白、undo/redo 等）时收起替换面板，避免面板开着却不可用
watch(hasSelection, (has) => {
  if (!has) closeMenu();
});

// 工具栏统一样式：动作按钮点击立即执行用 pointer；悬浮菜单触发器主交互是
// hover 展开（菜单栏惯例），用 default 光标，避免 pointer 承诺「点击即执行」
const btnClass =
  "size-8 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:pointer-events-none";
const triggerClass =
  "size-8 grid place-items-center rounded-md cursor-default text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:pointer-events-none";
// 形状菜单：大图标网格（每行 4 个自动换行），无文字标签，悬停/原始 tooltip 提示名称
const shapesMenuClass =
  "absolute top-[calc(100%+10px)] left-0 z-10 grid grid-cols-4 gap-1 w-60 p-1.5 bg-white rounded-xl shadow-lg shadow-black/10 ring-1 ring-black/10 before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-2";
const shapeItemClass =
  "w-14 h-14 grid place-items-center gap-1 rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-violet-600 transition-colors";

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

    <!-- 文档标题：左上角浮动 chip，样式与工具条一致（同为 44px 高：h-11）；
         默认只读展示，点铅笔进入编辑 -->
    <div
      class="absolute top-2 left-2 z-10 flex items-center h-11 px-1.5 gap-1.5 bg-white rounded-xl shadow-md ring-1 ring-neutral-50"
    >
      <input
        v-if="titleEditing"
        ref="titleInputRef"
        class="w-36 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"
        v-model="titleDraft"
        placeholder="未命名标题"
        title="文档标题"
        @input="onTitleInput"
        @keydown="onTitleKeydown"
        @blur="commitTitleEdit"
      />
      <template v-else>
        <span
          class="max-w-36 truncate text-sm"
          :class="editorStore.title ? 'text-gray-700' : 'text-gray-300'"
          :title="editorStore.title || '未命名标题'"
        >
          {{ editorStore.title || "未命名标题" }}
        </span>
        <button
          class="size-8 grid place-items-center rounded-md cursor-pointer text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="编辑标题"
          @click="startTitleEdit"
        >
          <Pencil class="size-5" />
        </button>
      </template>
    </div>

    <!-- 顶部悬浮工具条：全图标化 + hover intent 悬浮面板（参照 .examples/flowchart） -->
    <div
      class="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-1.5 h-11 bg-white rounded-xl shadow-md ring-1 ring-neutral-50 text-gray-600"
    >
      <!-- 历史 -->
      <button :class="btnClass" :disabled="!canUndo" title="撤销" @click="undo">
        <Undo class="size-5" />
      </button>
      <button :class="btnClass" :disabled="!canRedo" title="重做" @click="redo">
        <Redo class="size-5" />
      </button>

      <div class="w-px h-4 bg-gray-200 mx-1"></div>

      <!-- 添加形状：图标触发 + 形状图标网格（每行 4 个自动换行，悬停 tooltip 提示名称） -->
      <div
        ref="shapeMenuRef"
        class="relative"
        @mouseenter="scheduleMenu('add')"
        @mouseleave="closeMenu"
      >
        <button
          :class="[
            triggerClass,
            openMenu === 'add' ? 'bg-gray-100 text-gray-700' : '',
          ]"
          title="添加形状"
          @click="toggleMenu('add')"
        >
          <Plus class="size-5" />
        </button>
        <div v-show="openMenu === 'add'" :class="shapesMenuClass">
          <button
            v-for="s in SHAPE_OPTIONS"
            :key="s.kind"
            type="button"
            :class="shapeItemClass"
            :title="s.label"
            @click="
              addShape(s.kind, s.text);
              closeMenu();
            "
          >
            <component :is="SHAPE_ICONS[s.kind]" class="size-12" />
          </button>
        </div>
      </div>

      <!-- 替换选中形状：无选中时禁用；选中清空时面板自动收起 -->
      <div
        ref="replaceMenuRef"
        class="relative"
        @mouseenter="hasSelection && scheduleMenu('replace')"
        @mouseleave="closeMenu"
      >
        <button
          :class="[
            triggerClass,
            openMenu === 'replace' ? 'bg-gray-100 text-gray-700' : '',
          ]"
          :disabled="!hasSelection"
          title="替换选中形状"
          @click="hasSelection && toggleMenu('replace')"
        >
          <Swap class="size-5" />
        </button>
        <div v-show="openMenu === 'replace'" :class="shapesMenuClass">
          <button
            v-for="s in SHAPE_OPTIONS"
            :key="s.kind"
            type="button"
            :class="shapeItemClass"
            :title="s.label"
            @click="
              replaceShape(s.kind);
              closeMenu();
            "
          >
            <component :is="SHAPE_ICONS[s.kind]" class="size-12" />
          </button>
        </div>
      </div>

      <div class="w-px h-4 bg-gray-200 mx-1"></div>

      <button :class="btnClass" title="适应视图" @click="fitView">
        <Focus class="size-5" />
      </button>
      <button :class="btnClass" title="居中" @click="centerView">
        <Aiming class="size-5" />
      </button>

      <div class="w-px h-4 bg-gray-200 mx-1"></div>

      <!-- 缩放：± 步进快捷微调；百分比点击展开滑块（交互控件不走 hover 触发，避免误弹挡画布） -->
      <div ref="zoomMenuRef" class="relative flex items-center gap-0.5">
        <button :class="btnClass" title="缩小" @click="zoomOut">
          <ZoomOut class="size-5" />
        </button>
        <button
          class="h-7 px-1 flex items-center justify-center rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          :class="openMenu === 'zoom' ? 'bg-gray-100 text-gray-700' : ''"
          title="缩放"
          @click="toggleMenu('zoom')"
        >
          <span class="w-9 text-center text-[11px] tabular-nums"
            >{{ zoom }}%</span
          >
        </button>
        <button :class="btnClass" title="放大" @click="zoomIn">
          <ZoomIn class="size-5" />
        </button>
        <div
          v-show="openMenu === 'zoom'"
          class="absolute top-[calc(100%+8px)] right-0 z-10 min-w-45 flex items-center px-3.5 py-2.5 bg-white rounded-xl shadow-lg shadow-black/10 ring-1 ring-black/10"
        >
          <input
            class="h-1 w-36 cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
            :style="zoomTrackStyle"
            type="range"
            min="20"
            max="800"
            step="5"
            :value="zoom"
            @input="onZoomInput"
          />
        </div>
      </div>

      <div class="flex-1"></div>

      <button :class="btnClass" title="导出 PNG" @click="exportPng">
        <Download class="size-5" />
      </button>
    </div>
  </div>
</template>
