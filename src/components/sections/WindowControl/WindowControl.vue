<script setup lang="ts">
import { useWindowControl } from "@/composables/useWindowControl";
import { useHover } from "@/composables/useHover.ts";
import { useEditorViewStore } from "@/stores/editorView";
import SquareButton from "@/components/shared/SquareButton.vue";
import NavAndOutline from "./NavAndOutline.vue";
import { watch } from "vue";
import Close from "@/components/icons/Close.vue";
import Minimize from "@/components/icons/Minimize.vue";
import UnMaximize from "@/components/icons/UnMaximize.vue";
import Maximize from "@/components/icons/Maximize.vue";

// 元函数：隐藏窗口时重置编辑视图文档（状态与逻辑内聚在组件内，不经由父级）
const { setDoc } = useEditorViewStore();
const { isMaximized, minimize, toggleMaximize, hide } = useWindowControl();
const {
  isHover: isMinimizeHover,
  vHover: vMinimizeHover,
  unhover: unminimizeHover,
} = useHover();
const {
  isHover: isCloseHover,
  vHover: vCloseHover,
  unhover: uncloseHover,
} = useHover();

const handleMinimize = () => {
  minimize();
  unminimizeHover();
};

const handleHide = () => {
  hide();
  uncloseHover();
  setDoc(null);
};

watch(
  () => isMaximized.value,
  (v) => {
    console.log("max:" + v);
  },
);
</script>

<template>
  <div class="h-10 flex desktop-draggable">
    <div class="flex-1 flex items-center">
      <NavAndOutline />
    </div>
    <SquareButton
      v-minimize-hover
      :class="[isMinimizeHover ? 'bg-gray-100' : '']"
      @click="handleMinimize"
    >
      <Minimize class="w-5 h-5" />
    </SquareButton>
    <SquareButton class="hover:bg-gray-100" @click="toggleMaximize">
      <Maximize v-if="isMaximized" class="w-5 h-5" />
      <UnMaximize v-else class="w-5 h-5" />
    </SquareButton>
    <SquareButton
      v-close-hover
      :class="[isCloseHover ? 'hover:bg-red-500 hover:text-white' : '']"
      @click="handleHide"
    >
      <Close class="w-5 h-5" />
    </SquareButton>
  </div>
</template>
