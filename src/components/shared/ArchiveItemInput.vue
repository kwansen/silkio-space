<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";

const input = useTemplateRef("input");

interface Props {
  id: string;
  name: string;
}

const props = defineProps<Props>();

const name = ref("");

onMounted(() => {
  input.value?.focus();
  name.value = props.name;
});

const emit = defineEmits<{
  close: [];
}>();

const close = () => {
  emit("close");
};

const action = useArchiveSortAction();

const handleClick = async () => {
  if (!name.value) return;
  if (name.value !== props.name) {
    await action.updateName(props.id, name.value);
  }
  close();
};

import { onClickOutside, onKeyStroke } from "@vueuse/core";
import { useArchiveSortAction } from "@/actions/archiveSort";

// ESC 关闭
onKeyStroke("Escape", () => {
  close();
});

// 回车
onKeyStroke("Enter", () => {
  handleClick();
});

const box = useTemplateRef("box");

onClickOutside(box, () => {
  close();
});
</script>

<template>
  <div
    ref="box"
    class="h-full flex items-center gap-4 pr-4 focus-within:bg-gray-50"
  >
    <input
      v-model="name"
      ref="input"
      type="text"
      class="outline-none flex-1 h-full pl-4"
    />
    <div class="w-7 h-7 bg-gray-200 rounded-md" @click="handleClick"></div>
    <div class="w-7 h-7 bg-gray-200 rounded-md" @click="close"></div>
  </div>
</template>
