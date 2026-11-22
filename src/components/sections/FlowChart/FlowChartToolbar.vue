<!-- 流程图顶部悬浮工具条：全图标化 + 点击展开悬浮面板（参照 .examples/flowchart）。
纯展示+交互转发组件，画布动作由父组件 FlowChart.vue 提供 -->
<script setup lang="ts">
import { computed, watch, type Component, useTemplateRef } from "vue";
import type { ShapeKind } from "silkio-flowchart";
import { onClickOutside } from "@vueuse/core";
import { useToolbarMenu } from "@/utils/toolbarMenu";
import Redo from "@/components/icons/Redo.vue";
import Swap from "@/components/icons/Swap.vue";
import Undo from "@/components/icons/Undo.vue";
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

const props = defineProps<{
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  zoom: number;
}>();

const emit = defineEmits<{
  undo: [];
  redo: [];
  addShape: [kind: ShapeKind, text: string];
  replaceShape: [kind: ShapeKind];
  fitView: [];
  centerView: [];
  zoomIn: [];
  zoomOut: [];
  setZoom: [scale: number];
  exportPng: [];
}>();

// 内置形状清单（label 用于 tooltip，text 为新节点默认文案），
// note 由 noteShapes 插件注册，与 .examples/flowchart 的 shapeOptions 一致共 7 种
const SHAPE_OPTIONS: {
  kind: ShapeKind;
  label: string;
  text: string;
}[] = [
  { kind: "rect", label: "矩形 · 步骤", text: "" },
  { kind: "diamond", label: "菱形 · 判断", text: "" },
  { kind: "ellipse", label: "椭圆 · 起止", text: "" },
  {
    kind: "parallelogram",
    label: "平行四边形 · 输入输出",
    text: "",
  },
  {
    kind: "hexagon",
    label: "六边形 · 准备",
    text: "",
  },
  {
    kind: "database",
    label: "数据库",
    text: "",
  },
  { kind: "note", label: "便签", text: "" },
];

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

// 缩放滑块轨道填充：左侧紫色已填充段，右侧浅色剩余段
const zoomTrackStyle = computed(() => {
  const value = Math.min(800, Math.max(20, props.zoom));
  const fill = ((value - 20) / (800 - 20)) * 100;
  return {
    background: `linear-gradient(to right, #8b5cf6 ${fill}%, #e5e7eb ${fill}%)`,
  };
});
const onZoomInput = (event: Event) => {
  emit("setZoom", Number((event.target as HTMLInputElement).value) / 100);
};

// 点击菜单：点击开合，外点/Esc 关闭兜底
const { openMenu, closeMenu, toggleMenu } = useToolbarMenu();
const shapeMenuRef = useTemplateRef<HTMLDivElement>("shapeMenuRef");
const replaceMenuRef = useTemplateRef<HTMLDivElement>("replaceMenuRef");
const zoomMenuRef = useTemplateRef<HTMLDivElement>("zoomMenuRef");
onClickOutside(shapeMenuRef, closeMenu);
onClickOutside(replaceMenuRef, closeMenu);
onClickOutside(zoomMenuRef, closeMenu);

// 选中被清空（点画布空白、undo/redo 等）时收起替换面板，避免面板开着却不可用
watch(
  () => props.hasSelection,
  (has) => {
    if (!has) closeMenu();
  },
);

// 工具栏统一样式：动作按钮点击立即执行用 pointer；菜单触发器主交互是
// 点击展开面板，用 default 光标，避免 pointer 承诺「点击即执行」
const btnClass =
  "size-8 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:pointer-events-none";
const triggerClass =
  "size-8 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:pointer-events-none";
// 形状菜单：大图标网格（每行 4 个自动换行），无文字标签，悬停/原始 tooltip 提示名称
const shapesMenuClass =
  "absolute top-[calc(100%+10px)] left-0 z-10 grid grid-cols-4 gap-1 w-60 p-1.5 bg-white rounded-xl shadow-md ring-1 ring-neutral-50 before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-2";
const shapeItemClass =
  "w-14 h-14 grid place-items-center gap-1 rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-violet-600 transition-colors";
</script>

<template>
  <!-- 顶部悬浮工具条 -->
  <div
    class="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-1.5 h-11 bg-white rounded-xl shadow-md ring-1 ring-neutral-50 text-gray-600"
  >
    <!-- 历史 -->
    <button
      :class="btnClass"
      :disabled="!canUndo"
      title="撤销"
      @click="emit('undo')"
    >
      <Undo class="size-5" />
    </button>
    <button
      :class="btnClass"
      :disabled="!canRedo"
      title="重做"
      @click="emit('redo')"
    >
      <Redo class="size-5" />
    </button>

    <div class="w-px h-4 bg-gray-200 mx-1"></div>

    <!-- 添加形状：图标触发 + 形状图标网格（每行 4 个自动换行，悬停 tooltip 提示名称） -->
    <div ref="shapeMenuRef" class="relative">
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
            emit('addShape', s.kind, s.text);
            closeMenu();
          "
        >
          <component :is="SHAPE_ICONS[s.kind]" class="size-12" />
        </button>
      </div>
    </div>

    <!-- 替换选中形状：无选中时禁用；选中清空时面板自动收起 -->
    <div ref="replaceMenuRef" class="relative">
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
            emit('replaceShape', s.kind);
            closeMenu();
          "
        >
          <component :is="SHAPE_ICONS[s.kind]" class="size-12" />
        </button>
      </div>
    </div>

    <div class="w-px h-4 bg-gray-200 mx-1"></div>

    <button :class="btnClass" title="适应视图" @click="emit('fitView')">
      <Focus class="size-5" />
    </button>
    <button :class="btnClass" title="居中" @click="emit('centerView')">
      <Aiming class="size-5" />
    </button>

    <div class="w-px h-4 bg-gray-200 mx-1"></div>

    <!-- 缩放：± 步进快捷微调；百分比点击展开滑块（交互控件不走 hover 触发，避免误弹挡画布） -->
    <div ref="zoomMenuRef" class="relative flex items-center gap-0.5">
      <button :class="btnClass" title="缩小" @click="emit('zoomOut')">
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
      <button :class="btnClass" title="放大" @click="emit('zoomIn')">
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

    <button :class="btnClass" title="导出 PNG" @click="emit('exportPng')">
      <Download class="size-5" />
    </button>
  </div>
</template>
