<script setup lang="ts">
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { computed, onMounted, onUnmounted } from "vue";
import { nextTick, useAttrs, useTemplateRef } from "vue";

defineOptions({
  inheritAttrs: false,
});

interface Props {
  id?: string;
  placeholder?: string;
  name?: string;
}

defineProps<Props>();

const attrs = useAttrs();

// 合并固定样式与外部传入的 class
const rootClass = computed(() => {
  const base =
    "block w-full text-3xl leading-10 resize-none outline-none p-0 m-0 border-none overflow-hidden";
  return twMerge(clsx(base, attrs.class));
});

interface Emits {
  onChange: [];
  onInput: [];
  onEnter: [];
  onTab: [];
}

const emit = defineEmits<Emits>();

const v = defineModel<string>({ default: "" });

const titleRef = useTemplateRef("titleRef");

// 元函数：暴露聚焦输入框方法
defineExpose({ focus: () => titleRef.value?.focus() });

const resize = async () => {
  await nextTick();
  const el = titleRef.value;
  if (!el) return;
  el.style.height = "auto";
  const textHeight = el.scrollHeight;
  el.style.height = textHeight + "px";
};

const handleOnInput = () => {
  resize();
  emit("onInput");
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  const el = titleRef.value;
  if (!el) return;
  resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(el);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>
<template>
  <!-- block:textarea 默认是 inline-block，会与父容器基线对齐产生下方空隙, -->
  <!-- p-0 m-0 overflow-hidden:如果不这样使用，会导致有空位但提前换行，是的容器高度大于文字高度 -->
  <!-- resize-none:禁止手动拖拽 -->
  <textarea
    ref="titleRef"
    v-model="v"
    :name="name"
    :id="id"
    :placeholder="placeholder"
    :class="rootClass"
    rows="1"
    @input="handleOnInput"
    @change="emit('onChange')"
    @keydown.enter.prevent="emit('onEnter')"
    @keydown.tab.prevent="emit('onTab')"
  ></textarea>
</template>
