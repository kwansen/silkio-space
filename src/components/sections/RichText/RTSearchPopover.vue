<script setup lang="ts">
import Search from "@/components/icons/Search.vue";
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { Editor } from "@tiptap/vue-3";
import { ref, useTemplateRef } from "vue";
import RTSearchPopoverPanel from "./RTSearchPopoverPanel.vue";

interface Props {
  editor: Editor | undefined;
}

defineProps<Props>();

const target = useTemplateRef("traget");
const floating = useTemplateRef("floating");
const { floatingStyles } = useFloating(target, floating, {
  placement: "bottom-end",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

const show = ref(false);
</script>
<template>
  <div
    ref="traget"
    @click="show = !show"
    :class="show ? 'bg-gray-200' : 'hover:bg-gray-200'"
    class="size-7 rounded-md mx-1 grid place-items-center select-none text-neutral-500 hover:text-neutral-700"
  >
    <Search class="size-4" />
  </div>
  <div v-if="show" ref="floating" :style="floatingStyles">
    <RTSearchPopoverPanel :editor="editor" @close="show = false" />
  </div>
</template>
