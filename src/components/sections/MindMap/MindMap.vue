<script setup lang="ts">
// 思维导图编辑器：基于 silkio-mindmap（@silkor/core 画布引擎）。
// 文档 content 为 JSON 字符串，模型与 silkio-mindmap 的 MindMapNode 一致：
//   { text: string, children: MindMapNode[] }
// 装配为 starter-kit 模式：宿主自建 App 并安装 @silkor/preset 官方插件，
// 场景包只补自有插件（BuiltinTreeLayout 等）。
// 顶部工具栏参照 .examples/demo-mindmap：撤销重做/布局方向/连线样式/
// 折叠展开/适应居中/缩放/导出图片。
import { App } from "@silkor/core";
import { officialPlugins } from "@silkor/preset";
import { MindMap, type MindMapNode, type MindMapOptions } from "silkio-mindmap";
import type { EdgeShape } from "@silkor/core";
import type { Style } from "silkio-mindmap";
import { onClickOutside } from "@vueuse/core";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  useTemplateRef,
  type Component,
} from "vue";
import Focus from "@/components/icons/Focus.vue";
import Redo from "@/components/icons/Redo.vue";
import Undo from "@/components/icons/Undo.vue";
import EdgeBezier from "@/components/icons/EdgeBezier.vue";
import EdgeOrthogonalDouble from "@/components/icons/EdgeOrthogonalDouble.vue";
import EdgeOrthogonalRounded from "@/components/icons/EdgeOrthogonalRounded.vue";
import { useEditorAction } from "@/actions/editorAction";
import { mindMapAIGenerate } from "@/actions/aiAction";
import { setMindMapInstance } from "@/actions/canvasRegistry";
import { useHoverMenu } from "@/utils/toolbarMenu";
import { exportImage } from "@/utils/exportImage";
import { countWords } from "@/utils/text";
import ChevronsDownUp from "@/components/icons/ChevronsDownUp.vue";
import ChevronsUpDown from "@/components/icons/ChevronsUpDown.vue";
import Aiming from "@/components/icons/Aiming.vue";
import ZoomOut from "@/components/icons/ZoomOut.vue";
import ZoomIn from "@/components/icons/ZoomIn.vue";
import Download from "@/components/icons/Download.vue";
import RightMindmap from "@/components/icons/RightMindmap.vue";
import BothMindmap from "@/components/icons/BothMindmap.vue";
import LeftMindmap from "@/components/icons/LeftMindmap.vue";
import DownMindmap from "@/components/icons/DownMindmap.vue";

const props = defineProps<{ content: string }>();

const emit = defineEmits<{
  onReady: [];
  onContentSave: [content: string, plain_text: string, word_count: number];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const app = shallowRef<App>();
const mindmap = shallowRef<MindMap>();

// 工具栏状态：撤销重做可用性、缩放百分比
const canUndo = ref(false);
const canRedo = ref(false);
const zoom = ref(100);

// 布局方向与连线样式清单
type LayoutDirection = NonNullable<MindMapOptions["direction"]>;
const DIRECTION_OPTIONS: {
  value: LayoutDirection;
  label: string;
  short: string;
  icon: Component;
}[] = [
  { value: "right", label: "向右展开", short: "向右", icon: RightMindmap },
  { value: "left", label: "向左展开", short: "向左", icon: LeftMindmap },
  { value: "both", label: "两侧展开", short: "两侧", icon: BothMindmap },
  { value: "down", label: "向下展开", short: "向下", icon: DownMindmap },
];
// 触发器图标随当前方向变化
const directionIcon = computed(
  () => DIRECTION_OPTIONS.find((d) => d.value === direction.value)?.icon,
);
// 连线形状选项：'bezier' 纯贝塞尔 S 曲线，'path' 直角 Z 字折线，'rPath' 圆角折线
const EDGE_OPTIONS: {
  value: EdgeShape;
  label: string;
  short: string;
  icon: Component;
}[] = [
  {
    value: "bezier",
    label: "贝塞尔曲线",
    short: "曲线",
    icon: EdgeBezier,
  },
  {
    value: "path",
    label: "直角折线",
    short: "折线",
    icon: EdgeOrthogonalDouble,
  },
  {
    value: "rPath",
    label: "圆角折线",
    short: "圆角",
    icon: EdgeOrthogonalRounded,
  },
];
// 触发器图标随当前线型变化
const edgeIcon = computed(
  () => EDGE_OPTIONS.find((e) => e.value === edgeShape.value)?.icon,
);

// 级数样式配置（参照 .examples/mindmap 的 levelStyles）：index 0 为根节点（一级），
// 依次向深层级递增，超出配置长度套用最后一项。节点一律无边框（borderWidth: 0），
// 层级靠背景色深浅区分
const LEVEL_STYLES: Style[] = [
  // 一级样式：根节点
  {
    color: "#ffffffff",
    backgroundColor: "#A4B3C2",
    fontSize: 24,
    fontWeight: 500,
    fontFamily: "sans-serif",
    radius: 6,
    borderColor: "",
    borderWidth: 0,
    lineHeight: 1.4,
    padding: [8, 24],
  },
  // 二级样式：分支节点
  {
    color: "#1f2937",
    backgroundColor: "#DCE2E8",
    fontSize: 16,
    fontWeight: 500,
    fontFamily: "sans-serif",
    radius: 6,
    borderColor: "",
    borderWidth: 0,
    lineHeight: 1.4,
    padding: [6, 16],
  },
  // 三级样式
  {
    color: "#1f2937",
    backgroundColor: "#F9FAFB",
    fontSize: 14,
    fontWeight: 400,
    fontFamily: "sans-serif",
    radius: 6,
    borderColor: "",
    borderWidth: 0,
    lineHeight: 1.4,
    padding: [6, 12],
  },
  // 四级及以后样式（叶子节点）
  {
    color: "#1f2937",
    backgroundColor: "",
    fontSize: 14,
    fontWeight: 400,
    fontFamily: "sans-serif",
    radius: 6,
    borderColor: "",
    borderWidth: 0,
    lineHeight: 1.4,
    padding: [6, 12],
  },
];

// 场景偏好（direction/edgeStyle）不随 MindMap.toJSON 导出（仅节点树），参照
// .examples/mindmap 的 MindMapDoc：与数据树并列作为顶层字段持久化，打开时整场景还原
type Prefs = {
  direction?: LayoutDirection;
  edgeStyle?: EdgeShape;
};
type SavedDoc = { data: MindMapNode } & Prefs;

// 解析文档内容：新格式为 { data, direction, edgeStyle } 包装；兼容旧格式
// （裸节点树，或偏好并入根节点字段的过渡格式），空/损坏数据回退默认树
const parseContent = (raw: string): { data: MindMapNode } & Required<Prefs> => {
  const fallback = {
    data: { text: "中心主题", children: [] } as MindMapNode,
    direction: "right" as LayoutDirection,
    edgeStyle: "rPath" as EdgeShape,
  };
  try {
    const parsed = JSON.parse(raw) as (SavedDoc & Prefs) | null;
    if (!parsed) return fallback;
    // 新格式：包装对象
    if (parsed.data && typeof parsed.data.text === "string") {
      return {
        data: parsed.data,
        direction: DIRECTION_OPTIONS.some((d) => d.value === parsed.direction)
          ? (parsed.direction as LayoutDirection)
          : fallback.direction,
        edgeStyle: EDGE_OPTIONS.some((e) => e.value === parsed.edgeStyle)
          ? (parsed.edgeStyle as EdgeShape)
          : fallback.edgeStyle,
      };
    }
    // 旧格式：裸节点树（可能带过渡期并入根节点的偏好字段）
    const legacy = parsed as unknown as MindMapNode & Prefs;
    if (typeof legacy.text === "string") {
      return {
        data: legacy,
        direction: DIRECTION_OPTIONS.some((d) => d.value === legacy.direction)
          ? (legacy.direction as LayoutDirection)
          : fallback.direction,
        edgeStyle: EDGE_OPTIONS.some((e) => e.value === legacy.edgeStyle)
          ? (legacy.edgeStyle as EdgeShape)
          : fallback.edgeStyle,
      };
    }
  } catch {
    // 回退默认树
  }
  return fallback;
};

// 当前布局方向与连线样式（保存/恢复用），缺省连线样式为圆角折线
const direction = ref<LayoutDirection>("right");
const edgeShape = ref<EdgeShape>("rPath");

// 汇总整棵树的纯文本与字数
const collectText = (node: MindMapNode, out: string[] = []): string[] => {
  if (node.text) out.push(node.text);
  for (const child of node.children ?? []) collectText(child, out);
  return out;
};

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
  const saved: SavedDoc = {
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

// 悬浮面板（hover intent）：延迟展开/移出即收/点击切换；外点关闭兜底
const { openMenu, scheduleMenu, closeMenu, toggleMenu } = useHoverMenu();
const directionMenuRef = useTemplateRef<HTMLDivElement>("directionMenuRef");
const edgeMenuRef = useTemplateRef<HTMLDivElement>("edgeMenuRef");
const zoomMenuRef = useTemplateRef<HTMLDivElement>("zoomMenuRef");
onClickOutside(directionMenuRef, closeMenu);
onClickOutside(edgeMenuRef, closeMenu);
onClickOutside(zoomMenuRef, closeMenu);

// 工具栏统一样式：动作按钮点击立即执行用 pointer；悬浮菜单触发器主交互是
// hover 展开（菜单栏惯例），用 default 光标，避免 pointer 承诺「点击即执行」
const btnClass =
  "size-8 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:pointer-events-none";
const triggerClass =
  "size-8 grid place-items-center rounded-md cursor-default text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:pointer-events-none";
const tileClass =
  "w-16 flex flex-col items-center gap-1 py-2 rounded-md cursor-pointer transition-colors";
// 方向/连线选项面板：图标磁贴竖排（参照 .examples/mindmap）
const optionMenuClass =
  "absolute top-[calc(100%+10px)] left-0 z-10 flex flex-col items-center gap-1 p-1.5 bg-white rounded-xl shadow-lg shadow-black/10 ring-1 ring-black/10 before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-2";

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

    <!-- 顶部悬浮工具条：全图标化 + hover intent 悬浮面板（参照 .examples/mindmap） -->
    <div
      class="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-1.5 h-11 bg-white rounded-xl shadow-md ring-1 ring-neutral-50"
    >
      <!-- 历史 -->
      <button :class="btnClass" :disabled="!canUndo" title="撤销" @click="undo">
        <Undo class="size-5" />
      </button>
      <button :class="btnClass" :disabled="!canRedo" title="重做" @click="redo">
        <Redo class="size-5" />
      </button>

      <div class="w-px h-4 bg-gray-200 mx-1"></div>

      <!-- 布局方向：触发器随当前方向变化，面板为图标磁贴 -->
      <div
        ref="directionMenuRef"
        class="relative"
        @mouseenter="scheduleMenu('layout')"
        @mouseleave="closeMenu"
      >
        <button
          :class="[
            triggerClass,
            openMenu === 'layout' ? 'bg-gray-100 text-gray-700' : '',
          ]"
          title="布局方向"
          @click="toggleMenu('layout')"
        >
          <component :is="directionIcon" class="size-5" />
        </button>
        <div v-show="openMenu === 'layout'" :class="optionMenuClass">
          <button
            v-for="d in DIRECTION_OPTIONS"
            :key="d.value"
            :class="[
              tileClass,
              d.value === direction
                ? 'bg-violet-100 text-violet-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            ]"
            :title="d.label"
            @click="
              setLayout(d.value);
              closeMenu();
            "
          >
            <component :is="d.icon" class="size-8" />
            <span class="text-[10px] leading-none">{{ d.short }}</span>
          </button>
        </div>
      </div>

      <!-- 连线样式：触发器随当前线型变化 -->
      <div
        ref="edgeMenuRef"
        class="relative"
        @mouseenter="scheduleMenu('edge')"
        @mouseleave="closeMenu"
      >
        <button
          :class="[
            triggerClass,
            openMenu === 'edge' ? 'bg-gray-100 text-gray-700' : '',
          ]"
          title="连线样式"
          @click="toggleMenu('edge')"
        >
          <component :is="edgeIcon" class="size-5" />
        </button>
        <div v-show="openMenu === 'edge'" :class="optionMenuClass">
          <button
            v-for="e in EDGE_OPTIONS"
            :key="e.value"
            :class="[
              tileClass,
              e.value === edgeShape
                ? 'bg-violet-100 text-violet-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            ]"
            :title="e.label"
            @click="
              setEdgeStyle(e.value);
              closeMenu();
            "
          >
            <component :is="e.icon" class="size-8" />
            <span class="text-[10px] leading-none">{{ e.short }}</span>
          </button>
        </div>
      </div>

      <!-- 折叠 / 展开：两个低频但常用的动作直接平铺，双 V 形向内收=折叠、向外张=展开 -->
      <button :class="btnClass" title="折叠其他分支" @click="collapseOthers">
        <ChevronsDownUp class="size-5" />
      </button>
      <button :class="btnClass" title="展开全部" @click="expandAll">
        <ChevronsUpDown class="size-5" />
      </button>

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

      <div class="w-px h-4 bg-gray-200 mx-1"></div>

      <button :class="btnClass" title="导出 PNG" @click="exportPng">
        <Download class="size-5" />
      </button>
    </div>
  </div>
</template>
