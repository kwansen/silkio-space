<script setup lang="ts">
import { useUiStore } from "@/stores/uiStore";
import { Editor } from "@tiptap/vue-3";
import { ref } from "vue";

interface Props {
  editor: Editor | undefined;
}
const props = defineProps<Props>();
const url = ref("");

const { setRichtextDialog } = useUiStore();

const close = () => {
  setRichtextDialog("");
};

const handleConfirm = () => {
  props.editor?.chain().setImage({ src: url.value }).run();
  close();
};

import { onKeyStroke } from "@vueuse/core";

// ESC 关闭
onKeyStroke("Escape", () => {
  close();
});

// 回车提交
onKeyStroke("Enter", () => {
  handleConfirm();
});
</script>

<template>
  <div class="w-full h-9 flex items-center gap-4 mt-6">
    <div>链接</div>
    <input
      type="text"
      v-model="url"
      class="flex-1 h-9 rounded-md px-4 ring ring-gray-300 focus:ring-purple-300 outline-none"
    />
  </div>
  <div class="h-6"></div>
  <div class="flex justify-end">
    <button class="h-9 bg-gray-100 px-4 rounded-l-md" @click="close">
      取消
    </button>
    <button
      :disabled="!url"
      class="h-9 bg-purple-500 px-4 text-white rounded-r-md disabled:bg-purple-200 disabled:cursor-not-allowed"
      @click="handleConfirm"
    >
      确认
    </button>
  </div>
</template>
