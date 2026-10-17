import { CodeBlock } from "@tiptap/extension-code-block";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import CB from "./CodeBlock.vue";

export const CustomCodeBlock = CodeBlock.extend({
  addNodeView() {
    return VueNodeViewRenderer(CB);
  },
});
