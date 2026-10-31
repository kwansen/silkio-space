<script setup lang="ts">
import Unlink from "@/components/icons/Unlink.vue";
import { MarkViewContent, markViewProps } from "@tiptap/vue-3";
import { useEditorStore } from "@/stores/editorStore";
import { ref } from "vue";
import Pencil from "@/components/icons/Pencil.vue";

const props = defineProps(markViewProps);

const { setRichtextDialog } = useEditorStore();

const hover = ref(false);

let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const mouseenter = () => {
  clearTimeout(hideTimer);
  showTimer = setTimeout(() => {
    hover.value = true;
  }, 200);
};

const mouseleave = () => {
  clearTimeout(showTimer);
  hideTimer = setTimeout(() => {
    hover.value = false;
  }, 500);
};
</script>

<template>
  <a
    :href="props.mark.attrs.href"
    target="_blank"
    rel="noopener noreferrer nofollow"
    class="relative text-purple-700 cursor-pointer hover:underline"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
  >
    <MarkViewContent />
    <div
      v-if="hover"
      class="p-2 text-neutral-700 select-none flex items-center gap-2 cursor-default absolute left-1/2 top-full -translate-x-1/2 bg-white shadow-md rounded-md"
    >
      <div
        class="size-7 hover:bg-gray-100 grid place-items-center rounded-md"
        @click.stop="
          props.editor.chain().focus().extendMarkRange('link').run();
          setRichtextDialog('link');
        "
      >
        <Pencil class="size-5" />
      </div>
      <div
        class="size-7 hover:bg-gray-100 grid place-items-center rounded-md"
        @click.stop="props.editor.chain().focus().unsetLink().run()"
      >
        <Unlink class="size-5" />
      </div>
    </div>
  </a>
</template>
