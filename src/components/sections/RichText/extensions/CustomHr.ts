import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import Hr from "./Hr.vue";

export const CustomHr = HorizontalRule.extend({
  addNodeView() {
    return VueNodeViewRenderer(Hr);
  },
});
