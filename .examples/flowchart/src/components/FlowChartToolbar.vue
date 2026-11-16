<script setup lang="ts">
// 胶囊工具条：撤销/重做、添加/替换形状、剪贴板、适应视图、导出、缩放。
// 悬浮面板（hover intent）是纯 UI 状态，画布动作全部 emit 给宿主组件。
import { computed, onUnmounted, ref, watch } from "vue";
import type { ShapeKind } from "silkio-flowchart";
import type { ShapeOption } from "../lib/flowchart";
import Icon from "./Icon.vue";

const props = defineProps<{
  canUndo: boolean;
  canRedo: boolean;
  hasShapeSelection: boolean;
  zoom: number;
  copied: boolean;
  aiSidebarOpen: boolean;
  shapeOptions: readonly ShapeOption[];
}>();

const emit = defineEmits<{
  undo: [];
  redo: [];
  "add-shape": [kind: ShapeKind, text: string];
  "replace-shape": [kind: ShapeKind];
  fit: [];
  center: [];
  "copy-json": [];
  "export-json": [];
  "export-image": [];
  "export-image-hd": [];
  "zoom-input": [scale: number];
  "toggle-ai": [];
}>();

type MenuId = "add" | "replace" | "export" | "zoom";
const openMenu = ref<MenuId | null>(null);
let menuTimer: ReturnType<typeof setTimeout> | null = null;

// 纯 CSS hover 过于灵敏，鼠标划过工具条即弹面板易误触；点击触发器则即时切换
function showMenu(id: MenuId | null) {
  openMenu.value = id;
}
function scheduleMenu(id: MenuId) {
  if (menuTimer) clearTimeout(menuTimer);
  menuTimer = setTimeout(() => showMenu(id), 200);
}
function closeMenu() {
  if (menuTimer) {
    clearTimeout(menuTimer);
    menuTimer = null;
  }
  openMenu.value = null;
}
function toggleMenu(id: MenuId) {
  const wasOpen = openMenu.value === id;
  closeMenu();
  if (!wasOpen) showMenu(id);
}
onUnmounted(closeMenu);

// 选中被清空（点画布空白、undo/redo 等）时收起替换面板，避免面板开着却不可用
watch(
  () => props.hasShapeSelection,
  (has) => {
    if (!has) closeMenu();
  },
);

function pickAdd(opt: ShapeOption) {
  emit("add-shape", opt.kind, opt.text);
  closeMenu();
}
function pickReplace(opt: ShapeOption) {
  emit("replace-shape", opt.kind);
  closeMenu();
}
function onZoomInput(event: Event) {
  emit("zoom-input", Number((event.target as HTMLInputElement).value) / 100);
}

// 滑块轨道填充：左侧紫色已填充段，右侧浅色剩余段
const zoomTrackStyle = computed(() => {
  const value = Math.min(800, Math.max(20, props.zoom));
  const fill = ((value - 20) / (800 - 20)) * 100;
  return {
    background: `linear-gradient(to right, #8b5cf6 ${fill}%, #e5e7eb ${fill}%)`,
  };
});

const btnClass =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300";
const menuClass =
  "absolute top-[calc(100%+10px)] right-0 z-20 flex flex-col gap-0.5 rounded-[10px] bg-white p-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)] before:absolute before:-top-2.5 before:right-0 before:left-0 before:h-2.5 before:content-['']";
// 形状菜单：大图标网格（每行 4 个自动换行），无文字标签，悬停/原始 tooltip 提示名称
const shapesMenuClass =
  "absolute top-[calc(100%+10px)] right-0 z-20 flex flex-row flex-wrap w-60 gap-0.5 rounded-[10px] bg-white p-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)] before:absolute before:-top-2.5 before:right-0 before:left-0 before:h-2.5 before:content-['']";
const shapeItemClass =
  "flex h-14 w-14 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-violet-500";
const menuItemClass =
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs whitespace-nowrap text-gray-700 hover:bg-gray-100";
</script>

<template>
  <div
    id="toolbar"
    class="absolute top-4 right-4 z-10 flex items-center gap-0.5 rounded-[10px] bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
  >
    <button
      id="undo-btn"
      :class="btnClass"
      :disabled="!canUndo"
      title="撤销"
      aria-label="撤销"
      @click="emit('undo')"
    >
      <Icon name="i-undo" />
    </button>
    <button
      id="redo-btn"
      :class="btnClass"
      :disabled="!canRedo"
      title="重做"
      aria-label="重做"
      @click="emit('redo')"
    >
      <Icon name="i-redo" />
    </button>
    <span class="mx-0.5 h-4 w-px bg-gray-200"></span>

    <!-- 添加节点 -->
    <div class="relative" @mouseenter="scheduleMenu('add')" @mouseleave="closeMenu">
      <button :class="btnClass" title="添加节点" aria-label="添加节点" @click="toggleMenu('add')">
        <Icon name="i-plus-box" />
      </button>
      <div v-show="openMenu === 'add'" id="add-menu" :class="shapesMenuClass">
        <button
          v-for="opt in shapeOptions"
          :key="opt.kind"
          type="button"
          :class="shapeItemClass"
          :title="opt.label"
          :aria-label="opt.label"
          @click="pickAdd(opt)"
        >
          <Icon :name="opt.symbol" size="w-10 h-6" stroke="stroke-[1]" />
        </button>
      </div>
    </div>

    <!-- 替换选中节点形状：无选中形状时禁用（与撤销/重做同一禁用样式） -->
    <div
      class="relative"
      @mouseenter="hasShapeSelection && scheduleMenu('replace')"
      @mouseleave="closeMenu"
    >
      <button
        :class="btnClass"
        :disabled="!hasShapeSelection"
        title="替换选中节点形状"
        aria-label="替换选中节点形状"
        @click="hasShapeSelection && toggleMenu('replace')"
      >
        <Icon name="i-swap" />
      </button>
      <div v-show="openMenu === 'replace'" id="replace-menu" :class="shapesMenuClass">
        <button
          v-for="opt in shapeOptions"
          :key="opt.kind"
          type="button"
          :class="shapeItemClass"
          :title="opt.label"
          :aria-label="opt.label"
          @click="pickReplace(opt)"
        >
          <Icon :name="opt.symbol" size="w-10 h-6" stroke="stroke-[1]" />
        </button>
      </div>
    </div>

    <button id="fit-btn" :class="btnClass" title="适应视图" aria-label="适应视图" @click="emit('fit')">
      <Icon name="i-fit" />
    </button>
    <button id="center-btn" :class="btnClass" title="居中" aria-label="居中" @click="emit('center')">
      <Icon name="i-center" />
    </button>
    <span class="mx-0.5 h-4 w-px bg-gray-200"></span>

    <!-- 导出 -->
    <div class="relative" @mouseenter="scheduleMenu('export')" @mouseleave="closeMenu">
      <button :class="btnClass" title="导出" aria-label="导出" @click="toggleMenu('export')">
        <Icon name="i-export" />
      </button>
      <div v-show="openMenu === 'export'" id="export-menu" :class="menuClass">
        <button id="copy-json-btn" :class="menuItemClass" @click="emit('copy-json'); closeMenu()">
          {{ copied ? "已复制" : "复制 JSON" }}
        </button>
        <button id="export-json-btn" :class="menuItemClass" @click="emit('export-json'); closeMenu()">
          导出 JSON
        </button>
        <button id="export-img-btn" :class="menuItemClass" @click="emit('export-image'); closeMenu()">
          导出图片
        </button>
        <button id="export-hd-btn" :class="menuItemClass" @click="emit('export-image-hd'); closeMenu()">
          导出图片（2倍高清）
        </button>
      </div>
    </div>

    <!-- 缩放：以画布中心为锚点，范围与滚轮缩放一致（0.2–8） -->
    <div class="relative" @mouseenter="scheduleMenu('zoom')" @mouseleave="closeMenu">
      <button
        id="zoom-trigger"
        :class="btnClass"
        class="text-[11px] tabular-nums"
        title="缩放"
        @click="toggleMenu('zoom')"
      >
        <span id="zoom-label">{{ zoom }}</span>
      </button>
      <div
        v-show="openMenu === 'zoom'"
        :class="menuClass"
        class="min-w-45 items-center px-3.5 py-2.5"
      >
        <input
          id="zoom-range"
          class="h-1 w-35 cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.35)] [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-violet-500"
          type="range"
          min="20"
          max="800"
          step="5"
          :value="zoom"
          :style="zoomTrackStyle"
          aria-label="缩放比例"
          @input="onZoomInput"
        />
      </div>
    </div>

    <!-- AI 侧边栏开关 -->
    <button
      id="ai-toggle"
      class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-gray-100"
      :class="aiSidebarOpen ? 'text-violet-500' : 'text-gray-400'"
      title="AI 助手"
      aria-label="AI 助手"
      @click="emit('toggle-ai')"
    >
      <Icon name="i-sparkles" />
    </button>
  </div>
</template>
