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
    <div class="h-10 cursor-default flex items-center justify-end px-4">
      <button
        @click="copy"
        :disabled="success"
        class="w-7 h-7 grid place-items-center rounded-md"
        :class="success ? '' : 'hover:bg-gray-200 '"
      >
        <Success class="w-5 h-5 text-green-500" v-if="success" />
        <Copy class="w-5 h-5" v-else />
      </button>
    </div>
    <pre
      class="text-xs whitespace-nowrap bg-gray-50 overflow-x-auto p-4 [&::-webkit-scrollbar-thumb]:cursor-default"
    ><NodeViewContent as="code" class="whitespace-nowrap!"/></pre>
  </NodeViewWrapper>
</template>
