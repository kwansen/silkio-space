<script setup lang="ts">
import { MarkViewContent, markViewProps } from "@tiptap/vue-3";
import { useRichtextStore } from "@/stores/richtextStore";
import { useTemplateRef } from "vue";
import { linkPopoverEnter, linkPopoverLeave } from "./linkPopover";

const props = defineProps(markViewProps);

const { setDialog } = useRichtextStore();

// 本 mark view 只负责展示链接与上报 hover 事件，
// 弹层由全局单例（LinkPopover.vue + linkPopover.ts）渲染，唯一性由构造保证
const root = useTemplateRef<HTMLElement>("root");

const enter = () => {
  if (!root.value) return;
  linkPopoverEnter({
    anchor: root.value,
    href: props.mark.attrs.href,
    edit: () => {
      props.editor.chain().focus().extendMarkRange("link").run();
      setDialog("link");
    },
    remove: () => props.editor.chain().focus().unsetLink().run(),
  });
};
</script>

<template>
  <a
    ref="root"
    :href="props.mark.attrs.href"
    target="_blank"
    rel="noopener noreferrer nofollow"
    class="relative text-purple-700 cursor-pointer hover:underline"
    @mouseenter="enter"
    @mouseleave="linkPopoverLeave"
  >
    <MarkViewContent />
  </a>
</template>
