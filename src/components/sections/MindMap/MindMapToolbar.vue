<!-- 思维导图顶部悬浮工具条：全图标化 + hover intent 悬浮面板（参照 .examples/mindmap）。
纯展示+交互转发组件，画布动作由父组件 MindMap.vue 提供 -->
<script setup lang="ts">
import { computed, useTemplateRef, type Component } from "vue";
import type { EdgeShape } from "@silkor/core";
import { onClickOutside } from "@vueuse/core";
import { useToolbarMenu } from "@/utils/toolbarMenu";
import type { LayoutDirection } from "@/components/sections/MindMap/mindMapDoc";
import Focus from "@/components/icons/Focus.vue";
import Redo from "@/components/icons/Redo.vue";
import Undo from "@/components/icons/Undo.vue";
import EdgeBezier from "@/components/icons/EdgeBezier.vue";
import EdgeOrthogonalDouble from "@/components/icons/EdgeOrthogonalDouble.vue";
import EdgeOrthogonalRounded from "@/components/icons/EdgeOrthogonalRounded.vue";
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

const props = defineProps<{
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  direction: LayoutDirection;
  edgeShape: EdgeShape;
}>();

const emit = defineEmits<{
  undo: [];
  redo: [];
  setLayout: [value: LayoutDirection];
  setEdgeStyle: [value: EdgeShape];
  collapseOthers: [];
  expandAll: [];
  fitView: [];
  centerView: [];
  zoomIn: [];
  zoomOut: [];
  setZoom: [scale: number];
  exportPng: [];
}>();

// 布局方向清单
const DIRECTION_OPTIONS: {
  value: LayoutDirection;
  label: string;
  icon: Component;
}[] = [
  { value: "right", label: "向右展开", icon: RightMindmap },
  { value: "left", label: "向左展开", icon: LeftMindmap },
  { value: "both", label: "两侧展开", icon: BothMindmap },
  { value: "down", label: "向下展开", icon: DownMindmap },
];
// 触发器图标随当前方向变化
const directionIcon = computed(
  () => DIRECTION_OPTIONS.find((d) => d.value === props.direction)?.icon,
);

// 连线形状选项：'bezier' 纯贝塞尔 S 曲线，'path' 直角 Z 字折线，'rPath' 圆角折线
const EDGE_OPTIONS: {
  value: EdgeShape;
  label: string;
  icon: Component;
}[] = [
  { value: "bezier", label: "贝塞尔曲线", icon: EdgeBezier },
  { value: "path", label: "直角折线", icon: EdgeOrthogonalDouble },
  { value: "rPath", label: "圆角折线", icon: EdgeOrthogonalRounded },
];
// 触发器图标随当前线型变化
const edgeIcon = computed(
  () => EDGE_OPTIONS.find((e) => e.value === props.edgeShape)?.icon,
);

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
const directionMenuRef = useTemplateRef<HTMLDivElement>("directionMenuRef");
const edgeMenuRef = useTemplateRef<HTMLDivElement>("edgeMenuRef");
const zoomMenuRef = useTemplateRef<HTMLDivElement>("zoomMenuRef");
onClickOutside(directionMenuRef, closeMenu);
onClickOutside(edgeMenuRef, closeMenu);
onClickOutside(zoomMenuRef, closeMenu);

// 工具栏统一样式：动作按钮点击立即执行用 pointer；菜单触发器主交互是
// 点击展开面板，用 default 光标，避免 pointer 承诺「点击即执行」
const btnClass =
  "size-8 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:pointer-events-none";
const triggerClass =
  "size-8 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:pointer-events-none";
const tileClass =
  "w-16 flex flex-col items-center gap-1 py-2 rounded-md cursor-pointer transition-colors";
// 方向/连线选项面板：图标磁贴竖排（参照 .examples/mindmap）
const optionMenuClass =
  "absolute top-[calc(100%+10px)] left-0 z-10 flex flex-col items-center gap-1 p-1.5 bg-white rounded-xl shadow-md ring-1 ring-neutral-50 before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-2";
</script>

<template>
  <!-- 顶部悬浮工具条 -->
  <div
    class="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-1.5 h-11 bg-white rounded-xl shadow-md ring-1 ring-neutral-50"
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

    <!-- 布局方向：触发器随当前方向变化，面板为图标磁贴 -->
    <div ref="directionMenuRef" class="relative">
      <button
        :class="[
          triggerClass,
          openMenu === 'layout' ? 'bg-gray-100 text-gray-700' : '',
        ]"
        title="布局方向"
        @click="toggleMenu('layout')"
      >
        <component :is="directionIcon" class="size-5" fixed-stroke />
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
            emit('setLayout', d.value);
            closeMenu();
          "
        >
          <component :is="d.icon" class="size-8" fixed-stroke />
        </button>
      </div>
    </div>

    <!-- 连线样式：触发器随当前线型变化 -->
    <div ref="edgeMenuRef" class="relative">
      <button
        :class="[
          triggerClass,
          openMenu === 'edge' ? 'bg-gray-100 text-gray-700' : '',
        ]"
        title="连线样式"
        @click="toggleMenu('edge')"
      >
        <component :is="edgeIcon" class="size-5" fixed-stroke />
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
            emit('setEdgeStyle', e.value);
            closeMenu();
          "
        >
          <component :is="e.icon" class="size-8" fixed-stroke />
        </button>
      </div>
    </div>

    <!-- 折叠 / 展开：两个低频但常用的动作直接平铺，双 V 形向内收=折叠、向外张=展开 -->
    <button
      :class="btnClass"
      title="折叠其他分支"
      @click="emit('collapseOthers')"
    >
      <ChevronsDownUp class="size-5" />
    </button>
    <button :class="btnClass" title="展开全部" @click="emit('expandAll')">
      <ChevronsUpDown class="size-5" />
    </button>

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

    <div class="w-px h-4 bg-gray-200 mx-1"></div>

    <button :class="btnClass" title="导出 PNG" @click="emit('exportPng')">
      <Download class="size-5" />
    </button>
  </div>
</template>
