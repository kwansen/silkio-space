<script setup lang="ts">
import Pencil from "@/components/icons/Pencil.vue";
import Unlink from "@/components/icons/Unlink.vue";
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { toRef, useTemplateRef } from "vue";

interface Props {
  target: HTMLElement;
}

const props = defineProps<Props>();

const reference = toRef(props, "target");
const floating = useTemplateRef("floating");

const { floatingStyles } = useFloating(reference, floating, {
  placement: "top",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});
</script>

<template>
  <div
    ref="floating"
    class="z-1 h-11 bg-white shadow-md rounded-md flex items-center px-2 gap-2 cursor-default"
    :style="floatingStyles"
  >
    <div
      class="h-7 px-2 bg-purple-200 text-purple-700 grid place-items-center rounded-md"
    >
      默认视图
    </div>
    <div class="h-7 px-2 bg-gray-100 grid place-items-center rounded-md">
      卡片视图
    </div>
    <div class="w-7 h-7 grid place-items-center hover:bg-gray-100 rounded-md">
      <Pencil class="w-5 h-5" />
    </div>
    <div class="w-7 h-7 grid place-items-center hover:bg-gray-100 rounded-md">
      <Unlink class="w-5 h-5" />
    </div>
  </div>
</template>
