<script setup lang="ts">
import { type Component, computed, ref, useTemplateRef } from "vue";
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import ArrowDown from "@/components/icons/ArrowDown.vue";
import { Btn } from "./type.ts";

interface Prop {
  icon: Component;
  buttons: Btn[];
}

defineProps<Prop>();

const show = ref<boolean>(false);
const target = useTemplateRef("target");
const floating = useTemplateRef("floating");

const { floatingStyles } = useFloating(target, floating, {
  placement: "bottom-start",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

onClickOutside(
  floating,
  () => {
    show.value = false;
  },
  { ignore: [computed(() => target.value)] },
);
</script>
<template>
  <div
    ref="target"
    class="px-1 h-7 mx-1 rounded-md flex justify-center items-center text-gray-500 hover:text-gray-700"
    :class="show ? 'bg-gray-200' : 'hover:bg-gray-200'"
    @click="show = !show"
  >
    <component :is="icon" class="size-5" />
    <ArrowDown class="size-3" />
  </div>
  <div
    v-if="show"
    ref="floating"
    class="rounded-lg shadow-md bg-white px-1 py-1 select-none space-y-1"
    :style="floatingStyles"
  >
    <div
      v-for="b in buttons"
      class="px-4 h-12 flex items-center rounded-md"
      :class="[
        b.active()
          ? 'bg-purple-50 text-purple-400'
          : 'text-gray-500 hover:text-gray-700',
        !b.active() && !b.disabled() ? 'hover:bg-gray-100' : '',
        b.disabled() ? 'opacity-30' : '',
      ]"
      @click="!b.disabled() && (b.action(), (show = false))"
    >
      <component :is="b.icon" class="size-5 mr-2" />
      <span class="text-xs">{{ b.name }}</span>
      <span class="text-[10px] ml-auto">（{{ b.shortcut }}）</span>
    </div>
  </div>
</template>
