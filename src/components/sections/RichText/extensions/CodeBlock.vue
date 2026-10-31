<script setup lang="ts">
import Copy from "@/components/icons/Copy.vue";
import Success from "@/components/icons/Success.vue";
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
    <div class="h-7 cursor-default flex items-center justify-end px-4">
      <button
        @click="copy"
        type="button"
        :disabled="success"
        class="size-7 grid place-items-center"
        :class="success ? '' : 'hover:bg-gray-200 '"
      >
        <Success class="size-5 text-green-500" v-if="success" />
        <Copy class="size-5" v-else />
      </button>
    </div>
    <pre
      class="text-sm p-4 bg-gray-50 overflow-x-auto [&::-webkit-scrollbar-thumb]:cursor-default"
    ><code ><NodeViewContent class="whitespace-pre!" /></code></pre>
  </NodeViewWrapper>
</template>
