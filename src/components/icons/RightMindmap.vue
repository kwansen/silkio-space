<!-- 自绘：因为lucide风格无法适配both，所以只能自绘 -->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
  >
    <path
      d="M9 4 L8 4 C6.895 4 6 4.895 6 6 L6 18 C6 19.105 6.895 20 8 20 L9 20"
      :style="st1"
    />
    <path d="M14 4.059 L22 4.059" :style="st2" />
    <path d="M14 20 L22 20" :style="st2" />
    <path d="M14 12 L22 12" :style="st2" />
    <path d="M4 12 L9 12" :style="st1" />
    <path
      d="M2 12 C2 11.448 2.448 11 3 11 C3.552 11 4 11.448 4 12 C4 12.552 3.552 13 3 13 C2.448 13 2 12.552 2 12 Z"
      :style="st3"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from "vue";

// fixedStroke：是否固定描边宽度（不随 width/height 缩放），默认跟随缩放
const props = defineProps<{ fixedStroke?: boolean }>();

const ve = computed<CSSProperties>(() =>
  props.fixedStroke ? { vectorEffect: "non-scaling-stroke" } : {},
);

const st1 = computed<CSSProperties>(() => ({
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeMiterlimit: 10,
  ...ve.value,
}));

const st2 = computed<CSSProperties>(() => ({
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeMiterlimit: 10,
  opacity: 0.5,
  ...ve.value,
}));

const st3 = computed<CSSProperties>(() => ({
  fill: "currentColor",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeMiterlimit: 10,
  ...ve.value,
}));
</script>
