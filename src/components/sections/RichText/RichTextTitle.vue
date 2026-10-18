<script setup lang="ts">
import TitleArea from "@/components/shared/TitleArea.vue";
import { Editor } from "@tiptap/vue-3";
import { onMounted, useTemplateRef } from "vue";
const title = defineModel<string>();

interface Props {
  editor: Editor | undefined;
}

const props = defineProps<Props>();

// interface Emits {
//   onChange: [];
//   onInput: [];
//   onEnter: [];
//   onTab: [];
// }

// const emit = defineEmits<Emits>();

const titleAreaRef =
  useTemplateRef<InstanceType<typeof TitleArea>>("titleAreaRef");

onMounted(() => {
  titleAreaRef.value?.focus();
});

const insertAtFirst = () => {
  props.editor?.chain().focus().insertContentAt(0, { type: "paragraph" }).run();
};

const focusFirstLineStart = () => {
  props.editor?.chain().focus().setTextSelection({ from: 1, to: 1 }).run();
};
</script>

<template>
  <TitleArea
    ref="titleAreaRef"
    v-model="title"
    placeholder="请输入标题"
    @on-change=""
    @on-input=""
    @on-enter="insertAtFirst"
    @on-tab="focusFirstLineStart"
  />
</template>
