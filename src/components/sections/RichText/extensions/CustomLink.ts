import Link from "@tiptap/extension-link";
import { VueMarkViewRenderer } from "@tiptap/vue-3";
import L from "./Link.vue";

export const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      variant: {
        default: "plain",
        parseHTML: (element) => element.getAttribute("data-variant") || "plain",
        renderHTML: (attributes) => ({
          "data-variant": attributes.variant,
        }),
      },
    };
  },

  addMarkView() {
    return VueMarkViewRenderer(L);
  },
});
