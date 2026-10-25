<script setup lang="ts">
import { useShortcutRecorder, type Key } from "@/utils/useShortcutRecorder";
import type { Shortcut } from "@/types/setting";
import { computed, onUnmounted } from "vue";

interface Props {
  label: string;
}

defineProps<Props>();
const v = defineModel<Shortcut>({
  default: () => ({ name: "", code: "" }),
});

const { isRecording, shortcutList, start, end, onEnd } = useShortcutRecorder();

const MODIFIER_IDS = ["ctrl", "shift", "alt", "meta"];

const toShow = (keys: Key[]) => keys.map((item) => item.show).join("+");

const toCode = (keys: Key[]) =>
  keys
    .map((item) =>
      MODIFIER_IDS.includes(item.id)
        ? item.id[0].toUpperCase() + item.id.slice(1)
        : item.id,
    )
    .join(" + ");

const text = computed(() => {
  if (!isRecording.value) return v.value.name;
  return shortcutList.value.length === 0
    ? "正在录制..."
    : toShow(shortcutList.value);
});

const handleClick = () => {
  if (isRecording.value) {
    end();
  } else {
    start();
  }
};

onEnd((keys) => {
  // 最后一个按键必须是主键，
  // 单独的修饰键（Ctrl/Shift/Alt/Meta）不算有效快捷键
  // 长度只能是2或3
  const lastKey = keys[keys.length - 1];
  if (
    lastKey &&
    !MODIFIER_IDS.includes(lastKey.id) &&
    keys.length >= 2 &&
    keys.length <= 3
  ) {
    v.value = { name: toShow(keys), code: toCode(keys) };
  }
});

onUnmounted(() => end());
</script>

<template>
  <div class="flex items-center justify-between py-2">
    <span>{{ label }}</span>
    <div
      class="w-30 py-1 text-center rounded-md cursor-pointer"
      :class="isRecording ? 'bg-purple-200' : 'bg-gray-200'"
      @click="handleClick"
    >
      {{ text }}
    </div>
  </div>
</template>
