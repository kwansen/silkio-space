<script setup lang="ts">
import { Editor } from "@tiptap/vue-3";
import { FocusScope } from "@zhencai/vue-focus-scope";
import { onMounted, ref } from "vue";
import type { Node } from "@tiptap/pm/model";
interface Props {
  editor: Editor | undefined;
  node: Node;
  pos: number;
  block: boolean;
}

const props = defineProps<Props>();

const latex = ref<string>("");

const emit = defineEmits<{ close: [] }>();

const handleUpdate = () => {
  const chain = props.editor?.chain();
  if (!chain) return;
  if (props.block) {
    chain.updateBlockMath({ latex: latex.value, pos: props.pos }).run();
  } else {
    chain.updateInlineMath({ latex: latex.value, pos: props.pos }).run();
  }
  emit("close");
};

onMounted(() => {
  latex.value = props.node.attrs.latex;
});

import { onKeyStroke } from "@vueuse/core";

// ESC 关闭
onKeyStroke("Escape", () => {
  close();
});

// 回车
onKeyStroke("Enter", () => {
  handleUpdate();
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
      <div class="flex justify-end gap-2">
        <button
          class="h-9 bg-gray-100 px-4 rounded-md cursor-pointer"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          :disabled="!latex"
          class="h-9 bg-purple-500 px-4 rounded-md text-white cursor-pointer disabled:bg-purple-200 disabled:cursor-default"
          @click="handleUpdate"
        >
          更新
        </button>
      </div>
    </div>
  </FocusScope>
</template>
