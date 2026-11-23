<script setup lang="ts">
import TitleArea from "@/components/shared/TitleArea.vue";
import { useEditorAction } from "@/actions/editorAction";
import { useEditorStore } from "@/stores/editorStore";
import { Editor } from "@tiptap/vue-3";
import { onMounted, useTemplateRef, watch } from "vue";

const store = useEditorStore();
const { setDocTitle } = useEditorAction();

interface Props {
  editor: Editor | undefined;
}

const props = defineProps<Props>();

const titleAreaRef =
  useTemplateRef<InstanceType<typeof TitleArea>>("titleAreaRef");

onMounted(() => {
  titleAreaRef.value?.focus();
});

watch(
  () => store.title,
  (v) => {
    // 实时同步左侧目录列表中该文档的标题并防抖落库
    setDocTitle(v);
  },
);

const insertAtFirst = () => {
  props.editor?.chain().focus().insertContentAt(0, { type: "paragraph" }).run();
};

const focusFirstLineStart = () => {
  props.editor?.chain().focus("start").run();
};
</script>

<template>
  <TitleArea
    ref="titleAreaRef"
    class="px-2"
    v-model="store.title"
    placeholder="请输入标题"
    @on-enter="insertAtFirst"
    @on-tab="focusFirstLineStart"
  />
</template>
