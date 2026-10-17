import Link from "@tiptap/extension-link";
import { VueMarkViewRenderer } from "@tiptap/vue-3";
import L from "./Link.vue";

export const CustomLink = Link.extend({
  addMarkView() {
    return VueMarkViewRenderer(L);
  },
});
