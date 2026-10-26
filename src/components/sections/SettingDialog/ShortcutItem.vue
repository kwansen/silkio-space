<script setup lang="ts">
import { Shortcut } from "@/types/setting";
import { shortcutToShow } from "@/utils/shortcut";
import { useShortcutRecorder } from "@/utils/useShortcutRecorder";
import { onUnmounted } from "vue";

interface Props {
  label: string;
}

defineProps<Props>();
const v = defineModel<Shortcut>({
  default: () => ({
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: "",
    code: "",
  }),
});

const { isRecording, shortcut, start, end, onEnd } = useShortcutRecorder();

const handleClick = () => {
  if (isRecording.value) {
    end();
  } else {
    start();
  }
};

onEnd((shortcut) => {
  // 最后一个按键必须是主键，
  // 单独的修饰键（Ctrl/Shift/Alt/Meta）不算有效快捷键
  // 长度只能是2或3
  v.value = shortcut;
});

onUnmounted(() => end());
</script>

<template>
  <div class="flex items-center justify-between py-2">
    <span>{{ label }}</span>
    <div
      class="w-32 py-1 text-center rounded-md cursor-pointer"
      :class="isRecording ? 'bg-purple-200' : 'bg-gray-200'"
      @click="handleClick"
    >
      <!-- 正在记录且有内容 -->
      <div v-if="isRecording && shortcut">
        {{ shortcutToShow(shortcut) }}
      </div>
      <!-- 正在记录但无内容 -->
      <div v-if="isRecording && !shortcut" class="">正在录制...</div>
      <!-- 没有记录 -->
      <div v-if="!isRecording">
        {{ shortcutToShow(v) }}
      </div>
    </div>
  </div>
</template>
