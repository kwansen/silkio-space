<script setup lang="ts">
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { Btn } from "./type";
import { ref, useTemplateRef } from "vue";

interface Prop {
  b: Btn;
}

const target = useTemplateRef("target");
const floating = useTemplateRef("floating");
const hovered = ref(false);

const { floatingStyles } = useFloating(target, floating, {
  placement: "bottom",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

defineProps<Prop>();
</script>
<template>
  <div
    ref="target"
    class="group size-7 mx-1 rounded-md grid place-items-center relative"
    :class="[
      b.active() ? 'bg-purple-200 text-purple-700' : '',
      !b.active() && !b.disabled() ? 'hover:bg-gray-200' : '',
      b.disabled() ? 'opacity-30' : '',
    ]"
    @click="b.action()"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <component :is="b.icon" class="size-5" />
    <!-- <Teleport to="body"> -->
    <div
      :style="floatingStyles"
      ref="floating"
      v-show="hovered"
      class="flex items-center gap-2 px-2 py-1 rounded-md bg-white shadow-md whitespace-nowrap pointer-events-none"
    >
      <span class="text-xs">{{ b.name }}</span>
      <span class="text-[10px]">{{ b.shortcut }}</span>
    </div>
    <!-- </Teleport> -->
  </div>
</template>
