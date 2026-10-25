<script setup lang="ts">
import { useShortcutRecorder } from "@/utils/useShortcutRecorder";
import { computed, ref } from "vue";
import { onMounted, onUnmounted } from "vue";
const recorder = useShortcutRecorder();

onUnmounted(() => {
  recorder.end();
});

const toShow = (v: { id: string; show: string }[]) => {
  return v.map((item) => item.show).join("+");
};

const recording = ref<boolean>(false);

const handleClick = () => {
  if (recording.value) {
    recording.value = false;
    recorder.end();
  } else {
    recording.value = true;
    recorder.start();
  }
};

recorder.onEnd(() => {});

const text = computed(() => {
  if (recording.value && recorder.shortcutList.value.length === 0) {
    return "正在录制...";
  }
  if (recording.value && recorder.shortcutList.value.length > 0) {
    return toShow(recorder.shortcutList.value);
  } else {
    return "Ctrl + A";
  }
});
</script>
<template>
  <div class="flex items-center justify-between py-2">
    <span> 快捷搜索文档</span>
    <div
      class="w-30 py-1 text-center bg-gray-200 rounded-md"
      @click="handleClick"
    >
      {{ text }}
    </div>
  </div>
  <div class="flex items-center justify-between py-2">
    <span> 快捷创建文档</span>
    <div class="w-30 py-1 text-center bg-gray-200 rounded-md">Ctrl + A</div>
  </div>
</template>
