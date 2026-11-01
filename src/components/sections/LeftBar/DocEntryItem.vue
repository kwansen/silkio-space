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
    class="flex items-center cursor-pointer gap-1 h-7 px-4 relative border border-transparent group"
    :class="active ? 'bg-purple-200' : hovered ? 'bg-gray-100' : ''"
    @click="emit('open')"
  >
    <Mindmap v-if="entry.doc_type === 'mindMap'" class="size-4" />
    <Flowchart v-else-if="entry.doc_type === 'flowChart'" class="size-4" />
    <Doc v-if="entry.doc_type === 'richText'" class="size-4" />
    <span class="flex-1 min-w-0 truncate">{{
      entry.title || "未命名标题"
    }}</span>
    <div
      :class="hovered ? 'grid' : 'hidden'"
      class="absolute cursor-pointer aspect-square hover:text-red-700 right-0.5 place-items-center h-full bg-inherit"
      @click.stop="emit('remove')"
    >
      <Close class="size-4" />
    </div>
  </div>
</template>
