<script setup lang="ts">
import { useWindowControl } from "@/composables/useWindowControl";
import { useHover } from "@/composables/useHover.ts";
import SquareButton from "@/components/shared/SquareButton.vue";
import { windowControlIcons } from "@/icons/windowControlIcons";
import NavAndOutline from "./NavAndOutline.vue";

interface Emits {
  onHide: [];
}

const emit = defineEmits<Emits>();

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
  emit("onHide");
};
</script>

<template>
  <div class="h-10 flex desktop-draggable">
    <div class="flex-1 flex items-center">
      <NavAndOutline />
    </div>
    <SquareButton
      v-minimize-hover
      :class="[isMinimizeHover ? 'bg-gray-100' : '']"
      icon-class="w-5 h-5"
      @click="handleMinimize"
      :icon="windowControlIcons.minimize"
    />
    <SquareButton
      class="hover:bg-gray-100"
      icon-class="w-5 h-5"
      @click="toggleMaximize"
      :icon="
        isMaximized ? windowControlIcons.restore : windowControlIcons.maximize
      "
    />
    <SquareButton
      v-close-hover
      :class="[isCloseHover ? 'hover:bg-red-500 hover:text-white' : '']"
      icon-class="w-5 h-5"
      @click="handleHide"
      :icon="windowControlIcons.close"
    />
  </div>
</template>
