<!-- 自绘：lucide没有 -->
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
  >
    <path d="M12 9 L12 12 L12 12 L12 15" :style="st1" />
    <path d="M2 12 L12 12" :style="st1" />
    <path
      d="M22 3 L18 3 C14.686 3 12 5.686 12 9 L12 15 C12 18.314 14.686 21 18 21 L22 21"
      :style="st1"
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
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeMiterlimit: 10,
  ...ve.value,
}));
</script>
