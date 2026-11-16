<script setup lang="ts">
import Close from "@/components/icons/Close.vue";
import Doc from "@/components/icons/Doc.vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import { DocEntry } from "@/types/doc";

// 纯展示组件：hover 状态与拖拽锁由父组件统一管理，
// mouseenter/mouseleave 监听未在此声明，会透传到根元素
defineProps<{
  entry: DocEntry;
  active: boolean;
  hovered: boolean;
}>();

const emit = defineEmits<{
  open: [];
  remove: [];
}>();
</script>

<template>
  <div
    class="flex items-center cursor-pointer gap-1.5 h-8 px-2.5 relative rounded-md group"
    :class="active ? 'bg-purple-100' : hovered ? 'bg-gray-100' : ''"
    @click="emit('open')"
  >
    <Mindmap
      v-if="entry.doc_type === 'mindMap'"
      class="size-4 shrink-0 text-neutral-400"
    />
    <Flowchart
      v-else-if="entry.doc_type === 'flowChart'"
      class="size-4 shrink-0 text-neutral-400"
    />
    <Doc v-if="entry.doc_type === 'richText'" class="size-4 shrink-0 text-neutral-400" />
    <span class="flex-1 min-w-0 truncate pr-5">
      {{ entry.title || "未命名标题" }}
    </span>
    <div
      v-show="hovered"
      class="absolute cursor-pointer size-5 grid place-items-center rounded right-0 top-1/2 -translate-y-1/2 bg-inherit hover:bg-red-100 hover:text-red-700"
      @click.stop="emit('remove')"
    >
      <Close class="size-3.5" />
    </div>
  </div>
</template>
