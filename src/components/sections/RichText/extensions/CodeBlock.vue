<script setup lang="ts">
import Copy from "@/components/icons/Copy.vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";
import CheckCircle from "@/components/icons/CheckCircle.vue";
import { NodeViewContent, NodeViewWrapper, nodeViewProps } from "@tiptap/vue-3";
import { ref } from "vue";
const props = defineProps(nodeViewProps);

const success = ref<boolean>(false);

const copy = async () => {
  const text = props.node.textContent;
  try {
    await navigator.clipboard.writeText(text);
    success.value = true;
    setTimeout(() => {
      success.value = false;
    }, 2000);
  } catch {
    console.error;
  }
};
</script>

<template>
  <NodeViewWrapper class="bg-gray-100 rounded-md overflow-hidden my-[0.8rem]">
    <div class="h-9 cursor-default flex items-center justify-end px-3">
      <button
        @click="copy"
        type="button"
        :disabled="success"
        class="size-8 grid place-items-center rounded-md transition-colors duration-150 cursor-pointer disabled:cursor-default"
        :class="success ? '' : 'hover:bg-gray-200 active:bg-gray-300'"
      >
        <CheckCircle class="size-5 text-green-500" v-if="success" />
        <Copy class="size-5 text-gray-500" v-else />
      </button>
    </div>
    <ScrollArea class="text-sm bg-gray-50">
      <pre
        class="p-4"
      ><code><NodeViewContent class="whitespace-pre!" /></code></pre>
    </ScrollArea>
  </NodeViewWrapper>
</template>
