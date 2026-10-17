<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { Group } from "./type";
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { onClickOutside } from "@vueuse/core";
import ArrowDown from "@/components/icons/ArrowDown.vue";

interface Prop {
  group: Group;
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
    class="px-1 h-6.5 rounded-md flex justify-center items-center mx-0.5"
    :class="show ? 'bg-gray-200' : 'hover:bg-gray-200'"
    @click="show = !show"
  >
    <component :is="group.groupIcon" class="w-5 h-5" />
    <ArrowDown />
  </div>
  <div
    v-if="show"
    ref="floating"
    class="rounded-lg shadow-2xl bg-white px-1 py-2 select-none"
    :style="floatingStyles"
  >
    <div
      v-for="b in group.button"
      class="px-4 py-2 flex items-center"
      :class="[
        b.active() ? 'bg-purple-200 text-purple-700' : '',
        !b.active() && !b.disabled() ? 'hover:bg-gray-100' : '',
        b.disabled() ? 'opacity-30' : '',
      ]"
      @click="!b.disabled() && (b.action(), (show = false))"
    >
      <component :is="b.icon" class="w-5 h-5 mr-2" />
      <span class="text-xs">{{ b.name }}</span>
      <span class="text-[10px] ml-auto pl-6">{{ b.shortcut }}</span>
    </div>
  </div>
</template>
