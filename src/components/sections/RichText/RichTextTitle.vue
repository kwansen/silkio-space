<script setup lang="ts">
import TitleArea from "@/components/shared/TitleArea.vue";
import { Editor } from "@tiptap/vue-3";
import { onMounted, useTemplateRef } from "vue";
const title = defineModel<string>();

interface Props {
  editor: Editor | undefined;
}

// const props = defineProps<Props>();

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
</script>

<template>
  <TitleArea
    ref="titleAreaRef"
    v-model="title"
    placeholder="请输入标题"
    @on-change=""
    @on-input=""
    @on-enter=""
    @on-tab=""
  />
</template>
