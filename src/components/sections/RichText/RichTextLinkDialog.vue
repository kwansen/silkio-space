<!-- 
1. 无选中（光标折叠）：打开时 text/url 均为空，输入后确认会插入新文本并 setLink
2. 有选中但无 link：text 回填选中文本、url 为空，确认时若文本有改动先替换选区，再 setLink
3. 有选中且有 link：text/url 均回填（url 来自选区已有链接），确认时更新文本与链接
4. 确认时若文本被清空：删除选区，不设置链接 
-->

<script setup lang="ts">
import { FocusScope } from "@zhencai/vue-focus-scope";
import { useUiStore } from "@/stores/uiStore";
import { Editor } from "@tiptap/vue-3";
import { computed, onMounted, ref } from "vue";
const { setRichtextDialog } = useUiStore();
interface Props {
  editor: Editor | undefined;
}

const props = defineProps<Props>();

const text = ref<string>("");
const url = ref<string>("");
const disabled = computed(() => {
  return !url.value || !text.value;
});

const close = () => {
  setRichtextDialog("");
};

const handleClick = () => {
  const editor = props.editor;
  if (!editor) return;

  const { from, to } = editor.state.selection;
  const chain = editor.chain().focus();

  // 文本被清空时，直接删除选区
  if (text.value === "") {
    chain.deleteRange({ from, to }).run();
    return;
  }

  // 文本有改动时，先用新文本替换选区
  const textChanged = editor.state.doc.textBetween(from, to, "") !== text.value;
  if (textChanged) {
    chain.insertContentAt({ from, to }, text.value);
  }

  // 选中目标文本范围（替换后选区已失效，需重新指定）再设置链接
  chain
    .setTextSelection({ from, to: from + text.value.length })
    .setLink({ href: url.value, variant: "card" })
    .run();

  close();
};

onMounted(() => {
  if (!props.editor) return;
  const { from, to } = props.editor.state.selection;
  text.value = props.editor.state.doc.textBetween(from, to, "");
  // 选区已有链接时，回填到输入框
  if (!text.value) return;
  url.value = props.editor.getAttributes("link").href ?? "";
});
</script>
<template>
  <FocusScope
    class="inset-0 bg-black/10 fixed grid place-items-center"
    autofocus
  >
    <div class="w-lg px-10 pt-10 pb-4 bg-white rounded-lg">
      <div class="w-full h-9 flex items-center gap-4">
        <div>文本</div>
        <input
          type="text"
          v-model="text"
          class="flex-1 h-9 rounded-md px-4 ring ring-gray-300 focus:ring-purple-300 outline-none"
        />
      </div>

      <div class="h-6"></div>
      <div class="w-full h-9 flex items-center gap-4">
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
          :disabled="disabled"
          class="h-9 bg-purple-500 px-4 text-white rounded-r-md disabled:bg-purple-200 disabled:cursor-not-allowed"
          @click="handleClick"
        >
          确认
        </button>
      </div>
    </div>
  </FocusScope>
</template>
