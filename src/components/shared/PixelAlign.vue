<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const props = withDefaults(defineProps<{ size?: number }>(), { size: 16 });

const host = ref<HTMLElement | null>(null);
const cssSize = ref(`${props.size}px`);

// 让 1 个 SVG 单位恰好对应整数个物理像素：
// 物理尺寸取 viewBox 单位数的整数倍，避免 1.25/1.5 等非整数 DPR 下
// 线条跨越两个物理像素、被抗锯齿涂抹导致虚化
const compute = () => {
  const svg = host.value?.querySelector("svg");
  const grid = svg?.viewBox.baseVal.width || props.size;
  const dpr = window.devicePixelRatio || 1;
  const units = Math.max(1, Math.round((props.size * dpr) / grid));
  cssSize.value = `${(grid * units) / dpr}px`;
};

const onResize = () => compute();

onMounted(() => {
  compute();
  // 窗口拖到不同缩放率的显示器时 DPR 会变化，需重算
  window.addEventListener("resize", onResize, { passive: true });
});
onUnmounted(() => window.removeEventListener("resize", onResize));
</script>

<template>
  <span
    ref="host"
    class="pixel-align"
    :style="{ width: cssSize, height: cssSize }"
  >
    <slot />
  </span>
</template>

<style scoped>
.pixel-align {
  display: inline-flex;
  flex: none;
}
.pixel-align :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
