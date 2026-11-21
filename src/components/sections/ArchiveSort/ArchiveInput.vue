<script setup lang="ts">
import { useArchiveAction } from "@/actions/archiveAction";
import Check from "@/components/icons/Check.vue";
import { useArchiveStore } from "@/stores/archiveStore";
import { onClickOutside } from "@vueuse/core";
import { ref } from "vue";
import { onMounted, useTemplateRef } from "vue";

const store = useArchiveStore();
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

const action = useArchiveAction();
const name = ref("");

// 等创建+列表刷新完成后再关闭输入框：若先 setShow(false)，刷新落地前
// sortedArchives 仍为空，首次添加时会先闪一帧空态
const handleClick = async () => {
  if (!name.value) return;
  await action.createArchive(name.value);
  setShow(false);
};

import { onKeyStroke } from "@vueuse/core";
import Close from "@/components/icons/Close.vue";

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
    class="h-10 focus-within:bg-gray-100 flex items-center gap-4 pr-4"
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
      class="size-8 enabled:hover:bg-gray-200 enabled:cursor-pointer disabled:opacity-30 grid place-items-center rounded-md"
      @click="handleClick"
    >
      <Check class="size-5" />
    </button>
    <div
      class="size-8 cursor-pointer grid place-items-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-500"
      @click="setShow(false)"
    >
      <Close class="size-5" />
    </div>
  </div>
</template>
