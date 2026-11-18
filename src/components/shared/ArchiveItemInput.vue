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

const action = useArchiveAction();

const handleClick = async () => {
  if (!name.value) return;
  if (name.value !== props.name) {
    await action.updateName(props.id, name.value);
  }
  close();
};

import { onClickOutside, onKeyStroke } from "@vueuse/core";
import { useArchiveAction } from "@/actions/archiveAction.ts";
import Check from "../icons/Check.vue";
import Close from "../icons/Close.vue";

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
    class="h-full flex items-center gap-4 pr-4 focus-within:bg-gray-100"
  >
    <input
      v-model="name"
      ref="input"
      type="text"
      class="outline-none flex-1 h-full pl-4"
    />
    <button
      :disabled="name === props.name || !name"
      class="size-7 enabled:hover:bg-gray-200 enabled:cursor-pointer rounded-md grid place-items-center disabled:opacity-30"
      @click="handleClick"
    >
      <Check class="size-5" />
    </button>
    <div
      class="size-7 cursor-pointer rounded-md grid place-items-center text-gray-500 hover:bg-red-100 hover:text-red-600"
      @click="close"
    >
      <Close class="size-4" />
    </div>
  </div>
</template>
