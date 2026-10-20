<script setup lang="ts">
import { useArchiveSortAction } from "@/actions/archiveSort";
import Check from "@/components/icons/Check.vue";
import Close from "@/components/icons/Close.vue";
import { useArchiveSortStore } from "@/stores/archiveSortStore";
import { onClickOutside } from "@vueuse/core";
import { ref } from "vue";
import { onMounted, useTemplateRef } from "vue";

const store = useArchiveSortStore();
const { setShow } = store;

const box = useTemplateRef("box");
const input = useTemplateRef("input");

onMounted(() => {
  input.value?.focus();
});

onClickOutside(
  box,
  () => {
    setShow(false);
  },
  {
    ignore: ["#addArchiveBtn"],
  },
);

const action = useArchiveSortAction();
const name = ref("");

const handleClick = () => {
  if (!name.value) return;
  action.createArchive(name.value);
  setShow(false);
};

import { onKeyStroke } from "@vueuse/core";

// ESC 关闭
onKeyStroke("Escape", () => {
  setShow(false);
});

// 回车
onKeyStroke("Enter", () => {
  handleClick();
});
</script>

<template>
  <div
    ref="box"
    class="h-10 focus-within:bg-gray-50 flex items-center gap-4 pr-4"
  >
    <input
      ref="input"
      type="text"
      v-model="name"
      class="flex-1 h-full outline-none pl-4"
      @blur="input?.focus()"
    />
    <button
      :disabled="!name"
      class="w-7 h-7 enabled:hover:bg-gray-200 disabled:opacity-30 grid place-items-center rounded-md"
      @click="handleClick"
    >
      <Check class="w-5 h-5" />
    </button>
    <div
      class="w-7 h-7 hover:bg-gray-200 grid place-items-center rounded-md"
      @click="setShow(false)"
    >
      <Close class="w-5 h-5" />
    </div>
  </div>
</template>
