<script setup lang="ts">
import { useRichtextStore } from "@/stores/richtextStore";
import { Editor } from "@tiptap/vue-3";
import { FocusScope } from "@zhencai/vue-focus-scope";
import { ref } from "vue";

interface Props {
  editor: Editor | undefined;
}

const { setDialog } = useRichtextStore();

const latex = ref<string>("");

const props = defineProps<Props>();

const close = () => {
  setDialog("");
};

const handleClick = (block: boolean) => {
  const chain = props.editor?.chain();
  if (!chain) return;
  if (block) {
    chain.insertBlockMath({ latex: latex.value }).focus().run();
  } else {
    chain.insertInlineMath({ latex: latex.value }).focus().run();
  }
  close();
};

import { onKeyStroke } from "@vueuse/core";

// ESC 关闭
onKeyStroke("Escape", () => {
  close();
});

// 回车
onKeyStroke("Enter", () => {
  handleClick(true);
});
</script>

<template>
  <FocusScope
    class="inset-0 bg-black/10 fixed grid place-items-center"
    autofocus
  >
    <div class="w-lg px-10 pt-10 pb-4 bg-white rounded-lg">
      <div class="w-full h-9 flex items-center gap-4">
        <div>Latex</div>
        <input
          type="text"
          v-model="latex"
          class="flex-1 h-9 rounded-md px-4 ring ring-gray-300 focus:ring-purple-300 outline-none"
        />
      </div>
      <div class="h-6"></div>
      <div class="flex justify-end">
        <button class="h-9 bg-gray-100 px-4 rounded-l-md" @click="close">
          取消
        </button>
        <button
          :disabled="!latex"
          class="h-9 bg-blue-500 px-4 text-white disabled:bg-blue-200 disabled:cursor-not-allowed"
          @click="handleClick(false)"
        >
          行内插入
        </button>
        <button
          :disabled="!latex"
          class="h-9 bg-purple-500 px-4 text-white rounded-r-md disabled:bg-purple-200 disabled:cursor-not-allowed"
          @click="handleClick(true)"
        >
          块级插入
        </button>
      </div>
    </div>
  </FocusScope>
</template>
