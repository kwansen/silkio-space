<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from "vue";
import { useEventListener } from "@vueuse/core";
import TextButton from "@/components/shared/TextButton.vue";
import type { Folder } from "@/infrastructure/db/folder.ts";

interface Props {
  // 待编辑归档：null 表示弹窗关闭
  folder: Folder | null;
}

const props = defineProps<Props>();

interface Emits {
  // 关闭弹窗（取消、遮罩点击、Esc 或名称未变化时确认）
  onClose: [];
  // 确认重命名，携带校验后的新名称（由调用方执行重命名并关闭弹窗）
  onConfirm: [name: string];
}

const emit = defineEmits<Emits>();

const inputRef = useTemplateRef<HTMLInputElement>("inputRef");
const name = ref("");

// 元函数：弹窗打开时回填名称并全选聚焦
watch(
  () => props.folder,
  async (folder) => {
    if (!folder) return;
    name.value = folder.name;
    await nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  },
);

// 元函数：确认编辑（名称为空或未变化则直接关闭），重命名委托调用方执行
const handleConfirm = () => {
  const folder = props.folder;
  const v = name.value.trim();
  if (!folder || !v || v === folder.name) {
    emit("onClose");
    return;
  }
  emit("onConfirm", v);
};

// Esc 关闭弹窗（仅打开时）
useEventListener(window, "keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.folder) emit("onClose");
});
</script>

<template>
  <!-- 独立归档重命名弹窗：遮罩点击关闭 -->
  <div
    v-if="folder"
    class="fixed inset-0 bg-black/30 z-50 grid place-items-center"
    @click.self="emit('onClose')"
  >
    <div class="w-80 bg-white rounded-2xl p-4 shadow-xl select-none">
      <div class="text-sm text-neutral-700 mb-2">编辑归档名称</div>
      <input
        ref="inputRef"
        v-model="name"
        type="text"
        placeholder="归档名称"
        class="w-full h-8 text-sm px-2 rounded-md border border-purple-300 outline-none focus:border-purple-500 mb-3"
        @keydown.enter="handleConfirm"
      />
      <div class="flex justify-end gap-2">
        <TextButton
          class="h-7 px-3 text-xs rounded-md text-neutral-500 hover:bg-gray-100"
          @click="emit('onClose')"
        >
          取消
        </TextButton>
        <TextButton
          class="h-7 px-3 text-xs rounded-md text-white bg-purple-600 hover:bg-purple-500"
          @click="handleConfirm"
        >
          确定
        </TextButton>
      </div>
    </div>
  </div>
</template>
