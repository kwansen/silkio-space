<script setup lang="ts">
import TitleArea from "@/components/shared/TitleArea.vue";
import { useDocSvc } from "@/services/document";
import { useEditorStore } from "@/stores/editorStore";
import { emitTo } from "@tauri-apps/api/event";
import { Editor } from "@tiptap/vue-3";
import { useDebounceFn } from "@vueuse/core";
import { ref, watch } from "vue";
import { onMounted, useTemplateRef } from "vue";

const title = ref<string>("");
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
  const t = store.title;
  title.value = t;
  oldTitle.value = t;
});

const delayedSaveTitle = useDebounceFn(async (docId: string, v: string) => {
  if (v === oldTitle.value) return;
  await docSvc.update(docId, { title: v });
  oldTitle.value = v;
  // 等保存落库完成后再通知主窗口刷新，否则主窗口会查到旧数据
  emitTo("main", "refresh");
}, 1000);

watch(
  () => title.value,
  (v) => {
    const id = store.id;
    if (!id) return;
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
    v-model="title"
    placeholder="请输入标题"
    @on-enter="insertAtFirst"
    @on-tab="focusFirstLineStart"
  />
</template>
