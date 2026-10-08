<script setup lang="ts">
import TitleArea from "@/components/shared/TitleArea.vue";
import { Editor } from "@tiptap/vue-3";
import { useTemplateRef } from "vue";
const title = defineModel<string>();

interface Props {
  editor: Editor | undefined;
  class: string;
}

const props = defineProps<Props>();

interface Emits {
  onChange: [];
  onInput: [];
  onEnter: [];
  onTab: [];
}

const emit = defineEmits<Emits>();

const titleAreaRef =
  useTemplateRef<InstanceType<typeof TitleArea>>("titleAreaRef");

// 元函数：暴露聚焦标题输入框方法
defineExpose({ focus: () => titleAreaRef.value?.focus() });
</script>

<template>
  <TitleArea
    ref="titleAreaRef"
    :class="props.class"
    v-model="title"
    placeholder="请输入标题"
    @on-change="emit('onChange')"
    @on-input="emit('onInput')"
    @on-enter="emit('onEnter')"
    @on-tab="emit('onTab')" />
</template>
