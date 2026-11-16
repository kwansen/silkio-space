<script setup lang="ts">
// 胶囊工具条：撤销/重做、适应视图/居中、布局方向、连线形状、折叠/展开、
// 导出、缩放。悬浮面板（hover intent）是纯 UI 状态，画布动作全部 emit 给宿主组件。
import { computed, onUnmounted, ref } from "vue";
import type { EdgeShape } from "@silkor/core";
import {
  edgeIcons,
  edgeOptions,
  layoutIcons,
  layoutOptions,
  type LayoutDirection,
} from "../lib/mindmap";
import Icon from "./Icon.vue";

const props = defineProps<{
  canUndo: boolean;
  canRedo: boolean;
  layout: LayoutDirection;
  edge: EdgeShape;
  zoom: number;
  copied: boolean;
  aiSidebarOpen: boolean;
}>();

const emit = defineEmits<{
  undo: [];
  redo: [];
  "pick-layout": [value: LayoutDirection];
  "pick-edge": [value: EdgeShape];
  fit: [];
  center: [];
  "collapse-others": [];
  "expand-all": [];
  "copy-json": [];
  "export-json": [];
  "export-image": [];
  "export-image-hd": [];
  "zoom-input": [scale: number];
  "toggle-ai": [];
}>();

// ---- 悬浮面板：悬浮 200ms 延迟展开（hover intent），移出立即收起 ----
// 纯 CSS group-hover 过于灵敏，鼠标划过工具条即弹面板易误触；改为定时器延迟
type ToolbarMenu = "fold" | "layout" | "edge" | "export" | "zoom";
const openMenu = ref<ToolbarMenu | null>(null);
let menuTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleMenu(menu: ToolbarMenu) {
  if (menuTimer) clearTimeout(menuTimer);
  menuTimer = setTimeout(() => (openMenu.value = menu), 200);
}
function closeMenu() {
  if (menuTimer) {
    clearTimeout(menuTimer);
    menuTimer = null;
  }
  openMenu.value = null;
}
onUnmounted(closeMenu);

function pickLayout(value: LayoutDirection) {
  emit("pick-layout", value);
  closeMenu();
}

function pickEdge(value: EdgeShape) {
  emit("pick-edge", value);
  closeMenu();
}

function onZoomInput(event: Event) {
  emit("zoom-input", Number((event.target as HTMLInputElement).value) / 100);
}

// 滑块轨道填充：滑块左侧为紫色已填充段（与 AI 侧边栏同色），右侧为浅色剩余段
const zoomTrackStyle = computed(() => {
  const pct = ((props.zoom - 20) / (800 - 20)) * 100;
  return {
    background: `linear-gradient(to right, #8b5cf6 ${pct}%, #e5e7eb ${pct}%)`,
  };
});
</script>

<template>
  <!-- 单一胶囊工具条：撤销/重做可点击，其余项悬浮展开选项面板 -->
  <div
    class="absolute top-4 right-4 z-10 flex items-center gap-0.5 rounded-lg bg-white p-1 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
  >
    <button
      class="flex h-8 w-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
      :disabled="!canUndo"
      title="撤销"
      aria-label="撤销"
      @click="emit('undo')"
    >
      <Icon name="i-undo" class="block h-4 w-4" />
    </button>
    <button
      class="flex h-8 w-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
      :disabled="!canRedo"
      title="重做"
      aria-label="重做"
      @click="emit('redo')"
    >
      <Icon name="i-redo" class="block h-4 w-4" />
    </button>
    <span class="mx-0.5 h-4 w-px bg-gray-200"></span>

    <!-- 布局方向设置：横向（right）/ 左向（left）/ 双向平衡（both）/ 组织结构图（down） -->
    <div
      class="relative"
      @mouseenter="scheduleMenu('layout')"
      @mouseleave="closeMenu"
    >
      <button
        class="flex h-8 w-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm text-gray-800 hover:bg-gray-100"
        title="布局方向"
      >
        <Icon :name="layoutIcons[layout]" class="block h-4 w-4" />
      </button>
      <div
        class="absolute top-[calc(100%+10px)] right-0 z-20 flex-col items-center gap-0.5 rounded-lg bg-white p-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)] before:absolute before:inset-x-0 before:-top-2.5 before:h-2.5 before:content-['']"
        :class="openMenu === 'layout' ? 'flex' : 'hidden'"
      >
        <button
          v-for="opt in layoutOptions"
          :key="opt.value"
          class="flex h-14 w-14 cursor-pointer items-center justify-center rounded-md text-sm text-gray-500 hover:bg-gray-100"
          :class="{ 'bg-[#ede9fe] text-violet-700': layout === opt.value }"
          :title="opt.title"
          @click="pickLayout(opt.value)"
        >
          <Icon :name="layoutIcons[opt.value]" class="h-9 w-9" />
        </button>
      </div>
    </div>

    <!-- 连线形状设置 -->
    <div
      class="relative"
      @mouseenter="scheduleMenu('edge')"
      @mouseleave="closeMenu"
    >
      <button
        class="flex h-8 w-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm text-gray-800 hover:bg-gray-100"
        title="连线形状"
      >
        <Icon :name="edgeIcons[edge]" class="block h-4 w-4" />
      </button>
      <div
        class="absolute top-[calc(100%+10px)] right-0 z-20 flex-col items-center gap-0.5 rounded-lg bg-white p-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)] before:absolute before:inset-x-0 before:-top-2.5 before:h-2.5 before:content-['']"
        :class="openMenu === 'edge' ? 'flex' : 'hidden'"
      >
        <button
          v-for="opt in edgeOptions"
          :key="opt.value"
          class="flex h-14 w-14 cursor-pointer items-center justify-center rounded-md text-sm text-gray-500 hover:bg-gray-100"
          :class="{ 'bg-[#ede9fe] text-violet-700': edge === opt.value }"
          :title="opt.title"
          @click="pickEdge(opt.value)"
        >
          <Icon :name="edgeIcons[opt.value]" class="h-9 w-9" />
        </button>
      </div>
    </div>
    <button
      class="flex h-8 w-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm text-gray-800 hover:bg-gray-100"
      title="适应视图"
      aria-label="适应视图"
      @click="emit('fit')"
    >
      <Icon name="i-fit" class="block h-4 w-4" />
    </button>
    <button
      class="flex h-8 w-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm text-gray-800 hover:bg-gray-100"
      title="居中"
      aria-label="居中"
      @click="emit('center')"
    >
      <Icon name="i-center" class="block h-4 w-4" />
    </button>
    <!-- 折叠 / 展开：折叠其他（无选中时折叠全部）与展开全部 -->
    <div
      class="relative"
      @mouseenter="scheduleMenu('fold')"
      @mouseleave="closeMenu"
    >
      <button
        class="flex h-8 w-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm text-gray-800 hover:bg-gray-100"
        title="折叠 / 展开"
        aria-label="折叠 / 展开"
      >
        <Icon name="i-fold" class="block h-4 w-4" />
      </button>
      <div
        class="absolute top-[calc(100%+10px)] right-0 z-20 min-w-24 flex-col rounded-lg bg-white p-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)] before:absolute before:inset-x-0 before:-top-2.5 before:h-2.5 before:content-['']"
        :class="openMenu === 'fold' ? 'flex' : 'hidden'"
      >
        <button
          class="flex w-full cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
          title="折叠除选中分支外的节点，无选中时折叠全部"
          @click="emit('collapse-others')"
        >
          <Icon name="i-collapse-others" class="h-3.5 w-3.5 text-gray-400" />
          折叠其他
        </button>
        <button
          class="flex w-full cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
          title="展开全部折叠节点"
          @click="emit('expand-all')"
        >
          <Icon name="i-expand-all" class="h-3.5 w-3.5 text-gray-400" />
          展开全部
        </button>
      </div>
    </div>
    <span class="mx-0.5 h-4 w-px bg-gray-200"></span>

    <!-- 导出：复制 JSON / 下载 JSON / 导出图片 -->
    <div
      class="relative"
      @mouseenter="scheduleMenu('export')"
      @mouseleave="closeMenu"
    >
      <button
        class="flex h-8 w-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm text-gray-800 hover:bg-gray-100"
        title="导出"
      >
        <Icon name="i-export" class="block h-4 w-4" />
      </button>
      <div
        class="absolute top-[calc(100%+10px)] right-0 z-20 min-w-28 flex-col rounded-lg bg-white p-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)] before:absolute before:inset-x-0 before:-top-2.5 before:h-2.5 before:content-['']"
        :class="openMenu === 'export' ? 'flex' : 'hidden'"
      >
        <button
          class="w-full cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
          @click="emit('copy-json')"
        >
          {{ copied ? "已复制" : "复制 JSON" }}
        </button>
        <button
          class="w-full cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
          @click="emit('export-json')"
        >
          导出 JSON
        </button>
        <button
          class="w-full cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
          @click="emit('export-image')"
        >
          导出图片
        </button>
        <button
          class="w-full cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100"
          @click="emit('export-image-hd')"
        >
          导出图片（2倍高清）
        </button>
      </div>
    </div>

    <!-- 缩放：数字触发器 + 滑块面板 -->
    <div
      class="relative"
      @mouseenter="scheduleMenu('zoom')"
      @mouseleave="closeMenu"
    >
      <button
        class="flex h-8 w-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm text-gray-800 hover:bg-gray-100"
        title="缩放"
      >
        <span class="text-[11px] tabular-nums">{{ zoom }}</span>
      </button>
      <div
        class="absolute top-[calc(100%+10px)] right-0 z-20 min-w-45 flex-col items-center rounded-lg bg-white px-3.5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] before:absolute before:inset-x-0 before:-top-2.5 before:h-2.5 before:content-['']"
        :class="openMenu === 'zoom' ? 'flex' : 'hidden'"
      >
        <input
          class="h-1 w-35 cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
          :style="zoomTrackStyle"
          type="range"
          min="20"
          max="800"
          :value="zoom"
          step="5"
          @input="onZoomInput"
        />
      </div>
    </div>

    <!-- AI 侧边栏开关 -->
    <button
      class="flex h-8 w-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-md text-sm hover:bg-gray-100"
      :class="aiSidebarOpen ? 'text-violet-500' : 'text-gray-800'"
      title="AI 助手"
      @click="emit('toggle-ai')"
    >
      <Icon name="i-sparkles" class="block h-4 w-4" />
    </button>
  </div>
</template>
