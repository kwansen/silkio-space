<script setup lang="ts">
import TitleArea from "@/components/shared/TitleArea.vue";
import { useDocSvc } from "@/services/document";
import { useEditorStore } from "@/stores/editorStore";
import { notifyDataChanged } from "@/infrastructure/api/windowEvent";
import { Editor } from "@tiptap/vue-3";
import { useDebounceFn } from "@vueuse/core";
import { ref, watch } from "vue";
import { onMounted, useTemplateRef } from "vue";

const oldTitle = ref<string>("");

const store = useEditorStore();
const docSvc = useDocSvc();

interface Props {
  editor: Editor | undefined;
}

const props = defineProps<Props>();

const titleAreaRef =
  useTemplateRef<InstanceType<typeof TitleArea>>("titleAreaRef");

onMounted(() => {
  titleAreaRef.value?.focus();
  oldTitle.value = store.title;
});

const delayedSaveTitle = useDebounceFn(async (docId: string, v: string) => {
  if (v === oldTitle.value) return;
  await docSvc.update(docId, { title: v });
  oldTitle.value = v;
  // 等保存落库完成后再广播变更事实，否则其他窗口会查到旧数据
  notifyDataChanged();
}, 1000);

watch(
  () => store.title,
  (v) => {
    const id = store.id;
    if (!id) return;
    // 实时同步左侧目录列表中该文档的标题
    store.updateDocEntryTitle(id, v);
    delayedSaveTitle(id, v);
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
    v-model="store.title"
    placeholder="请输入标题"
    @on-enter="insertAtFirst"
    @on-tab="focusFirstLineStart"
  />
</template>
