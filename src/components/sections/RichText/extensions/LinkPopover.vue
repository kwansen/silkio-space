<script setup lang="ts">
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { computed, useTemplateRef } from "vue";
import {
  linkPopoverEnter,
  linkPopoverLeave,
  linkPopoverState,
} from "./linkPopover";
import Pencil from "@/components/icons/Pencil.vue";
import LinkOff from "@/components/icons/LinkOff.vue";

// 锚点随控制器状态动态切换，floating-ui 响应式跟随
const reference = computed(() => linkPopoverState.target?.anchor ?? null);
const floating = useTemplateRef<HTMLElement>("floating");

const { floatingStyles } = useFloating(reference, floating, {
  placement: "bottom",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="linkPopoverState.target"
      ref="floating"
      :style="floatingStyles"
      class="z-50 p-0.5 select-none flex items-center gap-2 cursor-default bg-white shadow-md rounded-md text-neutral-800"
      @mouseenter="
        linkPopoverState.target && linkPopoverEnter(linkPopoverState.target)
      "
      @mouseleave="linkPopoverLeave"
    >
      <button
        class="h-8 px-1 hover:bg-gray-100 flex items-center gap-1 rounded-md cursor-pointer"
        @click="linkPopoverState.target?.edit()"
      >
        <Pencil class="size-5" />
        <span class="text-xs">编辑链接</span>
      </button>
      <button
        class="h-8 px-1 hover:bg-gray-100 flex items-center gap-1 rounded-md cursor-pointer"
        @click="linkPopoverState.target?.remove()"
      >
        <LinkOff class="size-5" />
        <span class="text-xs">取消链接</span>
      </button>
    </div>
  </Teleport>
</template>
