<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import TextButton from "@/components/shared/TextButton.vue";
import type { Folder } from "@/infrastructure/db/folder.ts";

interface Props {
  // 待删除文件夹：null 表示弹窗关闭
  folder: Folder | null;
}

const props = defineProps<Props>();

interface Emits {
  // 关闭弹窗（取消、遮罩点击或 Esc）
  onClose: [];
  // 确认删除（由调用方执行级联删除并关闭弹窗）
  onConfirm: [];
}

const emit = defineEmits<Emits>();

// Esc 关闭弹窗（仅打开时）
useEventListener(window, "keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.folder) emit("onClose");
});
</script>

<template>
  <!-- 文件夹删除确认弹窗：级联删除文件夹及其子文件夹，文档本体保留 -->
  <div
    v-if="folder"
    class="fixed inset-0 bg-black/30 z-50 grid place-items-center"
    @click.self="emit('onClose')"
  >
    <div class="w-80 bg-white rounded-2xl p-4 shadow-xl select-none">
      <div class="text-sm text-neutral-700 mb-2">删除文件夹</div>
      <div class="text-xs text-neutral-500 mb-3">
        将删除「{{ folder.name }}」及其全部子文件夹，其中的文档不会被删除
      </div>
      <div class="flex justify-end gap-2">
        <TextButton
          class="h-7 px-3 text-xs rounded-md text-neutral-500 hover:bg-gray-100"
          @click="emit('onClose')"
        >
          取消
        </TextButton>
        <TextButton
          class="h-7 px-3 text-xs rounded-md text-white bg-purple-600 hover:bg-purple-500"
          @click="emit('onConfirm')"
        >
          删除
        </TextButton>
      </div>
    </div>
  </div>
</template>
