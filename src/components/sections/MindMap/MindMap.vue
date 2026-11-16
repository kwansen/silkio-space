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
import { onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from "vue";
import ArrowDown from "@/components/icons/ArrowDown.vue";
import Maximize from "@/components/icons/Maximize.vue";
import Redo from "@/components/icons/Redo.vue";
import Undo from "@/components/icons/Undo.vue";
import { useEditorAction } from "@/actions/editorAction";
import { useEditorStore } from "@/stores/editorStore";

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
const DIRECTION_OPTIONS: { value: LayoutDirection; label: string }[] = [
  { value: "right", label: "向右展开" },
  { value: "left", label: "向左展开" },
  { value: "both", label: "两侧展开" },
  { value: "down", label: "向下展开" },
];
const EDGE_OPTIONS: { value: EdgeShape; label: string }[] = [
  { value: "bezier", label: "贝塞尔曲线" },
  { value: "path", label: "直线" },
  { value: "rPath", label: "直角折线" },
];

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
    edgeStyle: "bezier" as EdgeShape,
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

// 当前布局方向与连线样式（保存/恢复用）
const direction = ref<LayoutDirection>("right");
const edgeShape = ref<EdgeShape>("bezier");

// 汇总整棵树的纯文本与字数
const collectText = (node: MindMapNode, out: string[] = []): string[] => {
  if (node.text) out.push(node.text);
  for (const child of node.children ?? []) collectText(child, out);
  return out;
};

// 根节点文本即文档标题（参照 .examples/mindmap 的 docName = toJSON().text）：
// 走 RichTextTitle 相同的落库路径（saveTitle 防抖 + 快照去重），并实时同步左侧目录
const editorStore = useEditorStore();
const { saveTitle } = useEditorAction();
const syncTitle = (rootText: string) => {
  const docId = editorStore.id;
  if (!docId || !rootText.trim()) return;
  editorStore.setTitle(rootText);
  editorStore.updateDocEntryTitle(docId, rootText);
  saveTitle(rootText);
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
    plainText.replace(/\s/g, "").length,
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

// 适应视图（只缩小不放大）：先 fit 拟合整棵可见子树，缩放被 fit 放大超过 1 时压回 1
// （参照 .examples/demo-mindmap 的 fitView 实现）
const fitView = () => {
  const mm = mindmap.value;
  if (!mm) return;
  mm.fit();
  if ((app.value?.camera.scale ?? 1) > 1) setZoom(1);
};

const centerView = () => mindmap.value?.center();

const exportPng = async () => {
  const mm = mindmap.value;
  if (!mm) return;
  const blob = await mm.toImage({ background: "#ffffff" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mindmap.png";
  a.click();
  URL.revokeObjectURL(url);
};

// 下拉菜单开关与外点关闭
const directionMenuOpen = ref(false);
const edgeMenuOpen = ref(false);
const directionMenuRef = useTemplateRef<HTMLDivElement>("directionMenuRef");
const edgeMenuRef = useTemplateRef<HTMLDivElement>("edgeMenuRef");
onClickOutside(directionMenuRef, () => (directionMenuOpen.value = false));
onClickOutside(edgeMenuRef, () => (edgeMenuOpen.value = false));

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
    onChange: () => {
      save();
      syncState();
    },
  });
  offViewport = app.value.camera.onViewportChange(() => {
    zoom.value = Math.round((app.value?.camera.scale ?? 1) * 100);
  });
  // init 是异步的：selectRoot 落定即场景就绪，适应视图后再显示窗口避免白屏闪烁
  await mindmap.value.selectRoot();
  fitView();
  syncState();
  // 挂载即同步根节点文本为标题（无编辑动作时 title 也跟随根节点）
  syncTitle(mindmap.value.toJSON().text);
  emit("onReady");
});

onBeforeUnmount(() => {
  offViewport?.();
  mindmap.value?.destroy();
  mindmap.value = undefined;
  app.value = undefined;
});
</script>

<template>
  <div class="flex flex-col h-full w-full select-none">
    <div
      class="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100 text-gray-700"
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

      <!-- 布局方向 -->
      <div ref="directionMenuRef" class="relative">
        <button
          class="h-7 px-2 flex items-center gap-1 rounded-md cursor-pointer hover:bg-gray-200 text-xs"
          title="布局方向"
          @click="directionMenuOpen = !directionMenuOpen"
        >
          方向
          <ArrowDown class="size-3 text-gray-400" />
        </button>
        <div
          v-if="directionMenuOpen"
          class="absolute top-full left-0 mt-1 z-10 w-32 p-1 bg-white rounded-lg shadow-2xl text-xs"
        >
          <div
            v-for="d in DIRECTION_OPTIONS"
            :key="d.value"
            class="px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 whitespace-nowrap"
            @click="
              setLayout(d.value);
              directionMenuOpen = false;
            "
          >
            {{ d.label }}
          </div>
        </div>
      </div>

      <!-- 连线样式 -->
      <div ref="edgeMenuRef" class="relative">
        <button
          class="h-7 px-2 flex items-center gap-1 rounded-md cursor-pointer hover:bg-gray-200 text-xs"
          title="连线样式"
          @click="edgeMenuOpen = !edgeMenuOpen"
        >
          连线
          <ArrowDown class="size-3 text-gray-400" />
        </button>
        <div
          v-if="edgeMenuOpen"
          class="absolute top-full left-0 mt-1 z-10 w-32 p-1 bg-white rounded-lg shadow-2xl text-xs"
        >
          <div
            v-for="e in EDGE_OPTIONS"
            :key="e.value"
            class="px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 whitespace-nowrap"
            @click="
              setEdgeStyle(e.value);
              edgeMenuOpen = false;
            "
          >
            {{ e.label }}
          </div>
        </div>
      </div>

      <button
        class="h-7 px-2 rounded-md cursor-pointer hover:bg-gray-200 text-xs"
        title="收起根节点外的其他分支"
        @click="collapseOthers"
      >
        收起其他
      </button>
      <button
        class="h-7 px-2 rounded-md cursor-pointer hover:bg-gray-200 text-xs"
        title="展开全部折叠节点"
        @click="expandAll"
      >
        全部展开
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
          stroke-width="1.5"
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
          stroke-width="1.5"
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

    <div class="flex-1 min-h-0">
      <canvas ref="canvasRef" class="block h-full w-full bg-white"></canvas>
    </div>
  </div>
</template>
