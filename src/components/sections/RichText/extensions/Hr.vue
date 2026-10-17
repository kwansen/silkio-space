<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from "@tiptap/vue-3";

const props = defineProps(nodeViewProps);
</script>

<template>
  <NodeViewWrapper>
    <div
      class="my-[0.8rem] py-[1.6rem]"
      :class="props.selected ? 'bg-purple-50  ' : ''"
    >
      <hr class="border-t border-neutral-300" />
    </div>
  </NodeViewWrapper>
</template>
