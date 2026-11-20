<script lang="ts">
// 所有链接实例共享的互斥状态：当前活跃弹层的立即关闭函数，
// 保证同一时间只有一个弹层显示（<script setup> 内的变量是每个实例各一份）
let hideActive: (() => void) | null = null;
</script>

<script setup lang="ts">
import LinkOff from "@/components/icons/LinkOff.vue";
import { MarkViewContent, markViewProps } from "@tiptap/vue-3";
import { useRichtextStore } from "@/stores/richtextStore";
import { onBeforeUnmount, ref, useTemplateRef } from "vue";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/vue";
import Pencil from "@/components/icons/Pencil.vue";

const props = defineProps(markViewProps);

const { setDialog } = useRichtextStore();

// 弹层仍是 <a> 的 DOM 子元素（点击时 PM 的 mousedown 会把光标移进链接），
// 但用 floating-ui 的 fixed 定位：position: fixed 不受 ScrollArea 的
// overflow: hidden 裁剪；autoUpdate 跟随滚动/布局变化
const root = useTemplateRef<HTMLElement>("root");
const floating = useTemplateRef<HTMLElement>("floating");
const { floatingStyles } = useFloating(root, floating, {
  placement: "bottom",
  middleware: [flip(), shift(), offset(8)],
  strategy: "fixed",
  whileElementsMounted: autoUpdate,
});

const hover = ref(false);

let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const hideNow = () => {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  hover.value = false;
  if (hideActive === hideNow) hideActive = null;
};

const mouseenter = () => {
  clearTimeout(hideTimer);
  clearTimeout(showTimer);
  // 立即关闭其他链接的弹层，避免快速悬浮多个链接时弹层叠加；
  // 活跃弹层是自己时（鼠标从弹层移回链接）不关闭自己
  if (hideActive && hideActive !== hideNow) hideActive?.();
  showTimer = setTimeout(() => {
    hover.value = true;
    hideActive = hideNow;
  }, 200);
};

const mouseleave = () => {
  clearTimeout(showTimer);
  hideTimer = setTimeout(hideNow, 500);
};

onBeforeUnmount(() => {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  if (hideActive === hideNow) hideActive = null;
});

// 弹层是 <a> 的子元素（在编辑器 DOM 内）：点击按钮时 ProseMirror 的
// mousedown 处理会自动把光标移进链接，unsetLink / extendMarkRange 直接生效
</script>

<template>
  <a
    ref="root"
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
      ref="floating"
      :style="floatingStyles"
      class="z-50 p-0.5 select-none flex items-center gap-2 cursor-default bg-white shadow-md rounded-md text-neutral-800 whitespace-nowrap"
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
    >
      <button
        class="h-8 px-1 hover:bg-gray-100 flex items-center gap-1 rounded-md cursor-pointer"
        @click.stop="
          props.editor.chain().focus().extendMarkRange('link').run();
          setDialog('link');
        "
      >
        <Pencil class="size-5" />
        <span class="text-xs">编辑链接</span>
      </button>
      <button
        class="h-8 px-1 hover:bg-gray-100 flex items-center gap-1 rounded-md cursor-pointer"
        @click.stop="props.editor.chain().focus().unsetLink().run()"
      >
        <LinkOff class="size-5" />
        <span class="text-xs">取消链接</span>
      </button>
    </div>
  </a>
</template>
