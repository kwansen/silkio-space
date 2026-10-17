<script setup lang="ts">
import { MarkViewContent, markViewProps } from "@tiptap/vue-3";

const props = defineProps(markViewProps);
</script>

<template>
  <a
    :href="props.mark.attrs.href"
    target="_blank"
    rel="noopener noreferrer nofollow"
    :class="
      props.mark.attrs.variant === 'card'
        ? 'block px-4 py-2 border border-neutral-300 cursor-pointer hover:bg-purple-50'
        : 'text-purple-700 hover:underline cursor-pointer'
    "
  >
    <MarkViewContent />
    <span
      v-if="props.mark.attrs.variant === 'card'"
      class="mt-1 block text-xs text-purple-700 break-all"
    >
      {{ props.mark.attrs.href }}
    </span>
  </a>
</template>
