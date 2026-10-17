<script setup lang="ts">
import { MarkViewContent, markViewProps } from "@tiptap/vue-3";
const props = defineProps(markViewProps);
</script>

<template>
  <a
    :href="props.mark.attrs.href"
    target="_blank"
    rel="noopener noreferrer nofollow"
    class="text-purple-700 hover:underline cursor-pointer"
  >
    <MarkViewContent />
  </a>
</template>
