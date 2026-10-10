<script setup lang="ts">
import { ref, watch } from "vue";
import { useEventListener } from "@vueuse/core";
import { Icon } from "@iconify/vue";
import TextButton from "@/components/shared/TextButton.vue";
import type { Doc } from "@/infrastructure/db/document.ts";

interface Props {
  // 待删除文档：null 表示弹窗关闭
  doc: Doc | null;
}

const props = defineProps<Props>();

interface Emits {
  // 关闭弹窗（取消、遮罩点击或 Esc）
  onClose: [];
  // 确认删除，携带是否同时永久删除文档（由调用方执行删除并关闭弹窗）
  onConfirm: [deleteDoc: boolean];
}

const emit = defineEmits<Emits>();

// 勾选"同时删除文档（不可恢复）"
const deleteDoc = ref(false);

// 元函数：弹窗打开时重置勾选状态
watch(
  () => props.doc,
  (doc) => {
    if (doc) deleteDoc.value = false;
  },
);

// Esc 关闭弹窗（仅打开时）
useEventListener(window, "keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.doc) emit("onClose");
});
</script>

<template>
  <!-- 文档删除弹窗：默认仅移出归档，可勾选同时永久删除文档 -->
  <div
    v-if="doc"
    class="fixed inset-0 bg-black/30 z-50 grid place-items-center"
    @click.self="emit('onClose')"
  >
    <div class="w-80 bg-white rounded-2xl p-4 shadow-xl select-none">
      <div class="text-sm text-neutral-700 mb-2">删除</div>
      <div class="text-xs text-neutral-500 mb-3 truncate">
        将「{{ doc.title || "未命名标题" }}」移出当前归档
      </div>
      <div
        class="h-8 flex items-center gap-2 px-2 rounded-md text-xs cursor-pointer hover:bg-gray-100 mb-3"
        @click="deleteDoc = !deleteDoc"
      >
        <Icon
          :icon="
            deleteDoc ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'
          "
          class="w-5 h-5"
          :class="deleteDoc ? 'text-purple-600' : 'text-neutral-300'"
        />
        <div>同时删除文档（不可恢复）</div>
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
          @click="emit('onConfirm', deleteDoc)"
        >
          确定
        </TextButton>
      </div>
    </div>
  </div>
</template>
