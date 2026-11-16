<script setup lang="ts">
// 流程图 Demo 宿主：只依赖 silkio-flowchart 的公开门面，App 与官方插件的
// 装配由场景包默认完成。Vue 只管理响应式 UI 状态，画布与门面实例保持为
// 非响应式变量，避免深度代理破坏内部状态。
import { onMounted, onUnmounted, ref } from "vue";
import { FlowChart } from "silkio-flowchart";
import type { FlowData, ShapeKind } from "silkio-flowchart";
import { initialData, noteShapes, shapeOptions } from "../lib/flowchart";
import {
  DEFAULT_DOC_NAME,
  deleteDoc,
  getDoc,
  listDocs,
  putDoc,
  type FlowChartDoc,
} from "../lib/idb";
import { useFlowChartAI } from "../composables/useFlowChartAI";
import IconSprites from "./IconSprites.vue";
import FlowChartToolbar from "./FlowChartToolbar.vue";
import FlowChartDocs from "./FlowChartDocs.vue";
import AISidebar from "./AISidebar.vue";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const initialized = ref(false);
const canUndo = ref(false);
const canRedo = ref(false);
const hasSelShape = ref(false);
const zoom = ref(100);
const copied = ref(false);

let flowchart: FlowChart | null = null;
let offViewportChange: (() => void) | null = null;
let offSelectionChange: (() => void) | null = null;

const {
  messages,
  pending,
  busy,
  sidebarOpen,
  settingsOpen,
  prompt,
  config,
  ready,
  aiGenerate,
  send: sendAi,
  stop: stopAi,
  clear: clearChat,
  toggleSettings,
  toggleSidebar,
  reset: resetChat,
} = useFlowChartAI(() => flowchart);

// ---- 文档管理状态（IndexedDB 持久化 + 自动保存）----
const docs = ref<FlowChartDoc[]>([]);
const currentId = ref("");
const docName = ref("");
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let docCreatedAt = 0;
// 上次落盘内容快照（整图数据 + 名称）：保存前对比，内容未变不写库。
// 打开/新建时以活模型 toJSON() 建立基线，setData 触发的 onChange 会被跳过
let lastSaved = "";
// 列表刷新序号（只接受最新一次结果）、文档切换序号（丢弃迟到的 openDoc）
let docsSeq = 0;
let switchToken = 0;
// 场景还原期间抑制 onSave：切换/新建导致的整图替换不属于用户编辑
let suppressSave = false;

function syncToolbar() {
  canUndo.value = flowchart?.canUndo ?? false;
  canRedo.value = flowchart?.canRedo ?? false;
}

function refreshDocs() {
  const seq = ++docsSeq;
  return listDocs()
    .then((all) => {
      if (seq === docsSeq) docs.value = all;
    })
    .catch(() => undefined);
}

function snapshotOf(data: FlowData, name: string) {
  return JSON.stringify([data, name]);
}

function normalizedName() {
  return docName.value.trim() || DEFAULT_DOC_NAME;
}

function markSaved() {
  if (!flowchart) return;
  lastSaved = snapshotOf(flowchart.toJSON(), normalizedName());
}

// 把当前场景数据落盘到当前文档：数据 + 名称一起保存，内容未变则跳过
function saveCurrent(): Promise<void> {
  if (!flowchart || !currentId.value || suppressSave) return Promise.resolve();
  const data = flowchart.toJSON();
  const name = normalizedName();
  const snapshot = snapshotOf(data, name);
  if (snapshot === lastSaved) return Promise.resolve();
  const doc: FlowChartDoc = {
    id: currentId.value,
    name,
    data,
    createdAt: docCreatedAt,
    updatedAt: Date.now(),
  };
  // 提前建立基线：写库期间的新变更会触发下一次保存，不会被并发写覆盖
  lastSaved = snapshot;
  return putDoc(doc)
    .then(() => refreshDocs())
    .catch(() => {
      // 写库失败：清除基线，后续变更会重新触发保存
      lastSaved = "";
    });
}

// 数据变化后防抖自动保存：连续编辑合并为一次写库
function scheduleSave() {
  if (!currentId.value || suppressSave) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void saveCurrent();
  }, 600);
}

// 切换/新建/关闭前立刻落盘：取消待保存的定时器，此时 currentId 尚未变更，归属正确
function flushSave(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  // 强制落盘：即使上次还原场景的抑制标记尚未复位，也不丢失当前文档的编辑
  suppressSave = false;
  return saveCurrent();
}

// 渲染文档后自动适应视图：整图落入视口并居中。仅缩小不放大（缩放上限 100%）：
// 视口插件的 fit 允许放大到 8 倍，单节点小文档会被放大到数百百分比，文档载入
// 场景按原尺寸居中即可；工具栏手动「适应视图」保持可放大语义。空文档跳过。
// AI 渲染（generate → renderAIGraph）不经过此路径，默认不动视口
function fitScene() {
  if (!flowchart) return;
  if (!flowchart.toJSON().nodes.length) return;
  flowchart.fit();
  if (flowchart.zoom > 1) flowchart.setZoom(1);
}

// 挂载/还原场景：首次以目标文档数据直接构造（model.load 不触发 onChange，
// 无需抑制自动保存）；后续沿用同一实例（装配与插件不重建），setData
// 摘旧挂新，并清空撤销栈避免一次 Ctrl+Z 退回上一份文档
function mountScene(data: FlowData) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  if (!flowchart) {
    flowchart = new FlowChart({
      canvas,
      data,
      // 第三方形状插件经 plugins 选项装配（在初始数据 load 之前安装）
      plugins: [noteShapes],
      // AI 生成适配器：模型只输出语义图，坐标与端口方向由包内布局器计算
      ai: aiGenerate,
      onChange: () => {
        if (suppressSave) return;
        queueMicrotask(syncToolbar);
        scheduleSave();
      },
    });
    // 构造器下一帧先居中，随后适应视图覆盖居中（同帧内按注册顺序执行）
    requestAnimationFrame(() => fitScene());
    // 选中变化 → 刷新替换形状按钮可用态（注册时先回调一次当前值）
    offSelectionChange =
      flowchart.onSelectionChange((has) => (hasSelShape.value = has)) ?? null;
  } else {
    suppressSave = true;
    flowchart.setData(data);
    flowchart.clearHistory();
    fitScene();
    queueMicrotask(() => {
      suppressSave = false;
    });
  }
  syncToolbar();
  markSaved();
}

function uniqueName(base: string) {
  const used = new Set(docs.value.map((d) => d.name));
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}

// 新建流程图：先落盘当前文档，再以新 id 建档并还原场景；initial 为首档示例数据
function createNew(initial?: FlowData, name?: string) {
  switchToken++;
  suppressSave = false;
  void flushSave();
  const now = Date.now();
  const data: FlowData = initial ?? {
    nodes: [{ shape: "ellipse", x: 320, y: 200, text: "开始" }],
    edges: [],
  };
  const doc: FlowChartDoc = {
    id: crypto.randomUUID(),
    name: name ?? uniqueName(DEFAULT_DOC_NAME),
    data,
    createdAt: now,
    updatedAt: now,
  };
  currentId.value = doc.id;
  docName.value = doc.name;
  docCreatedAt = now;
  resetChat();
  mountScene(data);
  // 建档即写入带 id 的规范化数据：新档节点原本无 id，setData 会生成，
  // 持久化它可保证下次打开时节点/连线引用稳定
  doc.data = flowchart?.toJSON() ?? data;
  void putDoc(doc)
    .then(() => refreshDocs())
    .catch(() => {
      lastSaved = "";
    });
}

// 打开指定文档：先落盘当前文档，再按档内整图数据还原场景
async function openDoc(id: string) {
  if (id === currentId.value) return;
  const token = ++switchToken;
  suppressSave = false;
  void flushSave();
  // 刚建档的写入可能尚未反映到列表，回退到内存列表，避免快速切换时打开失败
  const doc =
    (await getDoc(id).catch(() => undefined)) ??
    docs.value.find((d) => d.id === id);
  if (!doc || token !== switchToken) return;
  currentId.value = doc.id;
  docName.value = doc.name;
  docCreatedAt = doc.createdAt;
  resetChat();
  mountScene(doc.data);
}

// 删除文档：删除当前文档时不落盘（避免删后又被定时器写回），随后自动新建空白档
async function removeDoc(id: string) {
  const token = ++switchToken;
  const removingCurrent = id === currentId.value;
  if (removingCurrent && saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await deleteDoc(id).catch(() => undefined);
  await refreshDocs();
  if (token !== switchToken) return;
  if (removingCurrent) {
    currentId.value = "";
    createNew();
  }
}

function renameDoc(raw: string) {
  const name = raw.trim() || DEFAULT_DOC_NAME;
  if (name === docName.value) return;
  docName.value = name;
  void saveCurrent();
}

function undo() {
  flowchart?.undo();
  syncToolbar();
}

function redo() {
  flowchart?.redo();
  syncToolbar();
}

// 新增节点落在视口中心附近（逐个略微错开避免完全重叠）
let addCount = 0;
function addShape(kind: ShapeKind, text: string) {
  const canvas = canvasRef.value;
  if (!flowchart || !canvas) return;
  const rect = canvas.getBoundingClientRect();
  // 屏幕坐标 → 世界坐标走门面语义 API（浏览器事件坐标口径，画布偏移由相机扣除）
  const center = flowchart.screenToWorld(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2,
  );
  const offset = (addCount++ % 5) * 24 - 48;
  flowchart.addNode({ shape: kind, text, x: center.x - 80 + offset, y: center.y - 32 + offset });
}

function replaceShape(kind: ShapeKind) {
  flowchart?.replaceSelected(kind);
}
function fit() {
  flowchart?.fit();
}
function center() {
  flowchart?.center();
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function copyJson() {
  if (!flowchart) return;
  void navigator.clipboard
    ?.writeText(JSON.stringify(flowchart.toJSON(), null, 2))
    .then(() => {
      copied.value = true;
      setTimeout(() => (copied.value = false), 1500);
    })
    .catch(() => undefined);
}

function exportJson() {
  if (!flowchart) return;
  const json = JSON.stringify(flowchart.toJSON(), null, 2);
  console.log(json);
  download(new Blob([json], { type: "application/json" }), "flowchart.json");
}

async function exportImage() {
  if (!flowchart) return;
  download(await flowchart.toImage({ background: "#ffffff" }), "flowchart.png");
}

async function exportImageHd() {
  if (!flowchart) return;
  // 默认已是 2x，"2 倍高清" 再翻倍到 4x
  download(
    await flowchart.toImage({ background: "#ffffff", scale: 4 }),
    "flowchart-hd.png",
  );
}

function onZoomInput(scale: number) {
  flowchart?.setZoom(scale);
  zoom.value = Math.round(scale * 100);
}

onMounted(async () => {
  // 关闭页面前落盘尚未到期的防抖变更
  window.addEventListener("beforeunload", flushSave);

  // 直接读档渲染：打开最近编辑的文档；本地无历史文档时以示例数据建首档
  await refreshDocs();
  const [latest] = [...docs.value].sort((a, b) => b.updatedAt - a.updatedAt);
  if (latest) {
    currentId.value = latest.id;
    docName.value = latest.name;
    docCreatedAt = latest.createdAt;
    mountScene(latest.data);
  } else {
    createNew(initialData, "示例流程图");
  }
  // 滚轮等外部视口变化 → 同步滑块与百分比显示（门面创建后订阅一次）
  offViewportChange =
    flowchart?.onViewportChange((scale) => {
      zoom.value = Math.min(800, Math.max(20, Math.round(scale * 100)));
    }) ?? null;
  // 构造器下一帧居中、再下一帧完成相机重绘，之后显示画布避免跳变
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      initialized.value = true;
    }),
  );
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", flushSave);
  void flushSave();
  offViewportChange?.();
  offViewportChange = null;
  offSelectionChange?.();
  offSelectionChange = null;
  // 完整拆卸：门面自建宿主上的官方插件随场景一并卸载
  flowchart?.destroy();
  flowchart = null;
});
</script>

<template>
  <IconSprites />
  <div class="flex h-screen w-screen overflow-hidden">
    <!-- 画布区：悬浮控件锚定于此容器，宽度随 AI 侧边栏开合自动伸缩 -->
    <main id="stage" class="relative h-full min-w-0 flex-1">
      <canvas
        ref="canvasRef"
        class="block h-full w-full bg-white"
        :class="{ invisible: !initialized }"
      ></canvas>

      <!-- 文档切换器：列表 / 重命名 / 新建（画布 onChange 自动保存） -->
      <FlowChartDocs
        :docs="docs"
        :current-id="currentId"
        :doc-name="docName"
        @create="createNew()"
        @open="openDoc"
        @remove="removeDoc"
        @rename="renameDoc"
      />

      <FlowChartToolbar
        :can-undo="canUndo"
        :can-redo="canRedo"
        :has-shape-selection="hasSelShape"
        :zoom="zoom"
        :copied="copied"
        :ai-sidebar-open="sidebarOpen"
        :shape-options="shapeOptions"
        @undo="undo"
        @redo="redo"
        @add-shape="addShape"
        @replace-shape="replaceShape"
        @fit="fit"
        @center="center"
        @copy-json="copyJson"
        @export-json="exportJson"
        @export-image="exportImage"
        @export-image-hd="exportImageHd"
        @zoom-input="onZoomInput"
        @toggle-ai="toggleSidebar"
      />

    </main>

    <!-- AI 助手侧边栏：并列布局面板，保留对话历史 / 流式思考 / 执行反馈。
         收起时只隐藏不卸载，消息流与配置面板状态随开合保留 -->
    <AISidebar
      v-show="sidebarOpen"
      v-model="prompt"
      v-model:config="config"
      :messages="messages"
      :pending="pending"
      :busy="busy"
      :ready="ready"
      :settings-open="settingsOpen"
      @send="sendAi"
      @stop="stopAi"
      @clear="clearChat"
      @collapse="toggleSidebar"
      @toggle-settings="toggleSettings"
    />
  </div>
</template>
