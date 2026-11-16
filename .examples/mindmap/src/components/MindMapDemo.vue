<script setup lang="ts">
// 思维导图 Demo 宿主：装配 App 与官方插件、挂载 MindMap 场景，并负责文档管理
// （IndexedDB 持久化 + 自动保存）。UI 子组件（工具条 / 文档切换器 / AI 侧边栏）
// 只做展示与交互事件，画布动作由本组件统一执行。
import { onMounted, onUnmounted, ref } from "vue";
import { App, type EdgeShape } from "@silkor/core";
import { officialPlugins } from "@silkor/preset";
import { MindMap, type MindMapNode } from "silkio-mindmap";
import { listDocs, getDoc, putDoc, deleteDoc, type MindMapDoc } from "../idb";
import {
  download,
  levelStyles,
  sampleData,
  type LayoutDirection,
} from "../lib/mindmap";
import { useMindMapAI } from "../composables/useMindMapAI";
import IconSprites from "./IconSprites.vue";
import MindMapToolbar from "./MindMapToolbar.vue";
import MindMapDocs from "./MindMapDocs.vue";
import AISidebar from "./AISidebar.vue";

const canvasRef = ref<HTMLCanvasElement | null>(null);
// 工具条状态
const layout = ref<LayoutDirection>("right");
const edge = ref<EdgeShape>("rPath");
const zoom = ref(100);
const canUndo = ref(false);
const canRedo = ref(false);
// 复制 JSON 成功后的短暂反馈
const copied = ref(false);

const {
  messages: aiMessages,
  pending: aiPending,
  busy: aiBusy,
  sidebarOpen: aiSidebarOpen,
  settingsOpen: aiSettingsOpen,
  prompt: aiPrompt,
  config: aiConfig,
  ready: aiReady,
  generate: aiGenerate,
  send: sendAi,
  stop: stopAi,
  clear: clearAiChat,
} = useMindMapAI(
  () => mindmap,
  () => currentId.value,
);

// ---- 文档管理状态（IndexedDB 持久化 + 自动保存）----
// 已保存文档列表（仅用于文档 dialog）
const docs = ref<MindMapDoc[]>([]);
// 当前打开的文档 id 与名称；空 id 表示尚未打开（首帧）
const currentId = ref("");
const docName = ref("");
// 首个文档是否已从 IndexedDB 定位：标题在此前渲染骨架占位，
// 避免「未命名标题 → 真实标题」的读库闪变
const docReady = ref(false);
// 自动保存防抖定时器与当前文档建档时间
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let docCreatedAt = 0;
// 上次落盘内容快照（数据 + 方向 + 连线）：保存前对比，内容未变不写库。
// 打开/新建时建立基线，挂载还原触发的 onChange 因对比相等而不会误更新
let lastSaved = "";

// 非 响应式实例：App/MindMap 内部状态复杂，不做深度代理，UI 状态经上面的 ref 单向同步。
// mindmap 可为 null（异步首挂载前 / 文档切换重建间隙），UI 回调先做守卫
let app!: App;
let mindmap: MindMap | null = null;

function syncToolbar() {
  canUndo.value = mindmap?.canUndo ?? false;
  canRedo.value = mindmap?.canRedo ?? false;
  // 文档名跟随根节点文本：任何变化（编辑/撤销/重做/AI 编辑）都会经此同步
  if (mindmap) docName.value = mindmap.toJSON().text;
}

async function undo() {
  if (!mindmap) return;
  await mindmap.undo();
  syncToolbar();
}

async function redo() {
  if (!mindmap) return;
  await mindmap.redo();
  syncToolbar();
}

function pickLayout(value: LayoutDirection) {
  if (!mindmap) return;
  layout.value = value;
  // 同一实例原地设置：数据、选中态、撤销栈均保留
  void mindmap.setLayout(value);
}

function pickEdge(value: EdgeShape) {
  if (!mindmap) return;
  edge.value = value;
  // 同一实例原地重建连线，数据、选中态、撤销栈均保留
  mindmap.setEdgeStyle(value);
}

// 折叠其他：除选中节点及其祖先链外全部折叠（无选中时折叠全部，根节点保留）
async function collapseOthers() {
  if (!mindmap) return;
  await mindmap.collapseOthers();
  syncToolbar();
}

// 展开全部：清空整树折叠标志，恢复全部子树可见
async function expandAll() {
  if (!mindmap) return;
  await mindmap.expandAll();
  syncToolbar();
}

// 适应视图：按整棵可见子树包围盒拟合视口；居中：保持缩放只平移。
// 视口变化经 app.camera.onViewportChange 回流，缩放滑块自动同步
function fit() {
  mindmap?.fit();
}

function center() {
  mindmap?.center();
}

// 以画布中心为锚点设置缩放（与缩放滑块同一世界锚点换算）
function setZoom(scale: number) {
  const vp = app.camera.viewport;
  const rect = canvasRef.value!.getBoundingClientRect();
  // 画布中心的世界坐标在缩放前后保持不动
  const wx = (rect.width / 2 - vp.x) / vp.scale;
  const wy = (rect.height / 2 - vp.y) / vp.scale;
  zoom.value = Math.round(scale * 100);
  app.camera.setViewport({
    x: rect.width / 2 - wx * scale,
    y: rect.height / 2 - wy * scale,
    scale,
  });
  app.requestCameraRender();
}

// 渲染文档后自动适应视图：整棵导图落入视口并居中。仅缩小不放大（缩放上限 100%）：
// 视口插件的 fit 允许放大到 8 倍，节点少的小导图会被放大到数百百分比，文档载入
// 场景按原尺寸居中即可；工具栏手动「适应视图」保持可放大语义
function fitScene() {
  if (!mindmap) return;
  mindmap.fit();
  if (app.camera.scale > 1) setZoom(1);
}

function copyJson() {
  if (!mindmap) return;
  navigator.clipboard
    .writeText(JSON.stringify(mindmap.toJSON(), null, 2))
    .then(() => {
      copied.value = true;
      setTimeout(() => (copied.value = false), 1500);
    });
}

function exportJson() {
  if (!mindmap) return;
  download(
    new Blob([JSON.stringify(mindmap.toJSON(), null, 2)], {
      type: "application/json",
    }),
    "mindmap.json",
  );
}

async function exportImage() {
  if (!mindmap) return;
  // 白底 PNG：padding/scale 走能力默认值（24 世界像素 / 2x）
  const blob = await mindmap.toImage({ background: "#ffffff" });
  download(blob, "mindmap.png");
}

async function exportImageHd() {
  if (!mindmap) return;
  // 高清版：默认已是 2x，"2 倍高清" 再翻倍到 4x
  const blob = await mindmap.toImage({ background: "#ffffff", scale: 4 });
  download(blob, "mindmap-hd.png");
}

// ---- 文档管理（IndexedDB 持久化 + 自动保存）----

// 拉取文档列表（dialog 内展示，排序由 MindMapDocs 内部决定）
function refreshDocs() {
  return listDocs().then((all) => {
    docs.value = all;
  });
}

// 把当前场景数据落盘到当前文档（文档名取根节点文本，布局方向与连线样式随档保存）。
// 与上次落盘内容逐字段对比，完全相等则跳过：打开即触发、改后撤销回原样都不会误更新
function snapshotOf(
  data: MindMapNode,
  direction: LayoutDirection,
  edgeStyle: EdgeShape,
) {
  return JSON.stringify([data, direction, edgeStyle]);
}

function saveCurrent() {
  if (!mindmap || !currentId.value) return;
  const data = mindmap.toJSON();
  const snapshot = snapshotOf(data, layout.value, edge.value);
  if (snapshot === lastSaved) return;
  docName.value = data.text;
  void putDoc({
    id: currentId.value,
    name: docName.value,
    data,
    direction: layout.value,
    edgeStyle: edge.value,
    createdAt: docCreatedAt,
    updatedAt: Date.now(),
  }).then(() => {
    lastSaved = snapshot;
    return refreshDocs();
  });
}

// 数据变化后防抖自动保存：连续编辑合并为一次写库
function scheduleSave() {
  if (!currentId.value) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveCurrent();
  }, 600);
}

// 切换/新建/关闭前立刻落盘：取消待保存的定时器，此时 currentId 尚未变更，归属正确；
// 内容与上次落盘相等时 saveCurrent 内部会跳过，不会产生空更新
function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  saveCurrent();
}

// 挂载场景：宿主 App 与官方插件复用（MindMap.destroy 对称拆卸自有插件与
// 场景节点，App 不受影响），销毁旧门面后以新数据重建，实现打开/新建导图
function mountScene(
  nodeData: MindMapNode,
  direction: LayoutDirection,
  shape: EdgeShape,
) {
  mindmap?.destroy();
  mindmap = new MindMap({
    app,
    data: nodeData,
    direction,
    edgeStyle: shape,
    levelStyles,
    // AI 编辑生成适配器（OpenAI 兼容接口，配置见 AI 侧边栏设置面板）
    ai: aiGenerate,
    // 数据变化（新增/删除/移动/文本编辑/折叠/布局/连线/AI 编辑）时同步工具条并自动保存；
    // 挂载还原触发的 onChange 由 saveCurrent 的内容对比兜底，不会误写库
    onChange: () => {
      syncToolbar();
      scheduleSave();
    },
  });
  syncToolbar();
  // 新建/切换导图自动适应视图，随后激活根节点（selectRoot 等待异步初始化
  // 完成后再执行 fitScene，此时整棵树已布局、包围盒可用）
  void mindmap.selectRoot().then(() => fitScene());
  // 临时调试：暴露实例供浏览器自动化测试定位节点（验证后移除）
  (window as any).__mindmap = mindmap;
}

// 新建导图：先落盘当前文档，再以新 id 建档并重建场景；initial 为首档示例数据
function createNew(initial?: MindMapNode) {
  flushSave();
  const now = Date.now();
  const docData = initial ?? { text: "中心主题", children: [] };
  const doc: MindMapDoc = {
    id: crypto.randomUUID(),
    name: docData.text,
    data: docData,
    direction: layout.value,
    edgeStyle: edge.value,
    createdAt: now,
    updatedAt: now,
  };
  currentId.value = doc.id;
  docName.value = doc.name;
  docCreatedAt = now;
  lastSaved = snapshotOf(docData, doc.direction, doc.edgeStyle);
  void putDoc(doc).then(refreshDocs);
  clearAiChat();
  mountScene(doc.data, doc.direction, doc.edgeStyle);
}

// 打开指定文档：先落盘当前文档，再按档内偏好（方向/连线）还原场景
async function openDoc(id: string) {
  if (id === currentId.value) return;
  flushSave();
  const doc = await getDoc(id);
  if (!doc) return;
  currentId.value = doc.id;
  docName.value = doc.name;
  docCreatedAt = doc.createdAt;
  layout.value = doc.direction;
  edge.value = doc.edgeStyle;
  lastSaved = snapshotOf(doc.data, doc.direction, doc.edgeStyle);
  clearAiChat();
  mountScene(doc.data, doc.direction, doc.edgeStyle);
}

// 删除文档：删除当前文档时不落盘（避免删后又被定时器写回），随后自动新建空白档
async function removeDoc(id: string) {
  if (id === currentId.value) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    currentId.value = "";
    await deleteDoc(id);
    refreshDocs();
    createNew();
  } else {
    await deleteDoc(id);
    refreshDocs();
  }
}

onMounted(async () => {
  const canvas = canvasRef.value!;

  // 显式装配：自建 App 并安装官方插件预设（集合与顺序的单一事实来源在 @silkor/preset），
  // MindMap 按能力键复用这些能力，只补齐自有的布局插件
  app = new App(canvas);
  for (const p of officialPlugins()) app.use(p);

  // 滚轮等外部视口变化 → 同步滑块与百分比显示
  app.camera.onViewportChange(() => {
    zoom.value = Math.round(app.camera.scale * 100);
  });

  // 关闭页面前落盘未保存的变更
  window.addEventListener("beforeunload", flushSave);

  // 打开最近编辑的文档；本地无历史文档时以示例数据新建首档
  await refreshDocs();
  const latest = docs.value.reduce<(typeof docs.value)[number] | null>(
    (acc, d) => (!acc || d.updatedAt > acc.updatedAt ? d : acc),
    null,
  );
  if (latest) {
    currentId.value = latest.id;
    docName.value = latest.name;
    docCreatedAt = latest.createdAt;
    layout.value = latest.direction;
    edge.value = latest.edgeStyle;
    lastSaved = snapshotOf(latest.data, latest.direction, latest.edgeStyle);
    mountScene(latest.data, latest.direction, latest.edgeStyle);
  } else {
    // 首次使用：以示例数据创建首个文档
    createNew(sampleData);
  }
  // 首个文档已定位：标题从骨架占位切换为真实名称，避免"未命名标题"闪变
  docReady.value = true;
});

onUnmounted(() => {
  window.removeEventListener("beforeunload", flushSave);
  flushSave();
  mindmap?.destroy();
  mindmap = null;
});
</script>

<template>
  <!-- 图标精灵表（隐藏挂载一次，全组件按 name 引用 symbol） -->
  <IconSprites />
  <!-- 整体布局：画布区（flex-1）与 AI 侧边栏并列，侧边栏为布局元素而非悬浮层 -->
  <div class="flex h-screen w-screen overflow-hidden">
    <!-- 画布区：悬浮控件锚定于此容器，宽度随侧边栏开合自动伸缩 -->
    <div class="relative min-w-0 flex-1">
      <canvas ref="canvasRef" class="block h-full w-full bg-white"></canvas>

      <!-- 文档切换器：标题按钮 + 新建按钮 + 文档列表 dialog -->
      <MindMapDocs
        :docs="docs"
        :current-id="currentId"
        :doc-name="docName"
        :ready="docReady"
        @create="createNew()"
        @open="openDoc"
        @remove="removeDoc"
      />

      <!-- 胶囊工具条：撤销/重做、布局方向、连线形状、折叠/导出/缩放 -->
      <MindMapToolbar
        :can-undo="canUndo"
        :can-redo="canRedo"
        :layout="layout"
        :edge="edge"
        :zoom="zoom"
        :copied="copied"
        :ai-sidebar-open="aiSidebarOpen"
        @undo="undo"
        @redo="redo"
        @pick-layout="pickLayout"
        @pick-edge="pickEdge"
        @fit="fit"
        @center="center"
        @collapse-others="collapseOthers"
        @expand-all="expandAll"
        @copy-json="copyJson"
        @export-json="exportJson"
        @export-image="exportImage"
        @export-image-hd="exportImageHd"
        @zoom-input="setZoom"
        @toggle-ai="aiSidebarOpen = !aiSidebarOpen"
      />
    </div>

    <!-- AI 助手侧边栏：并列布局面板，保留对话历史 / 流式思考 / 执行反馈 -->
    <AISidebar
      v-model="aiPrompt"
      v-model:config="aiConfig"
      :messages="aiMessages"
      :pending="aiPending"
      :busy="aiBusy"
      :ready="aiReady"
      :settings-open="aiSettingsOpen"
      @send="sendAi"
      @stop="stopAi"
      @clear="clearAiChat"
      @collapse="aiSidebarOpen = false"
      @toggle-settings="aiSettingsOpen = !aiSettingsOpen"
    />
  </div>
</template>
