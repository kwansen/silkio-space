<script setup lang="ts">
import AlignCenter from "@/components/icons/AlignCenter.vue";
import AlignJustify from "@/components/icons/AlignJustify.vue";
import AlignLeft from "@/components/icons/AlignLeft.vue";
import AlignRight from "@/components/icons/AlignRight.vue";
import Bold from "@/components/icons/Bold.vue";
import CodeBlock from "@/components/icons/CodeBlock.vue";
import H1 from "@/components/icons/H1.vue";
import H2 from "@/components/icons/H2.vue";
import H3 from "@/components/icons/H3.vue";
import H4 from "@/components/icons/H4.vue";
import H5 from "@/components/icons/H5.vue";
import H6 from "@/components/icons/H6.vue";
import Highlight from "@/components/icons/Highlight.vue";
import Image from "@/components/icons/Image.vue";
import InlineCode from "@/components/icons/InlineCode.vue";
import Italic from "@/components/icons/Italic.vue";
import LetterT from "@/components/icons/LetterT.vue";
import Link from "@/components/icons/Link.vue";
import Math from "@/components/icons/Math.vue";
import Quote from "@/components/icons/Quote.vue";
import Redo from "@/components/icons/Redo.vue";
import Strike from "@/components/icons/Strike.vue";
import Subscript from "@/components/icons/Subscript.vue";
import Superscript from "@/components/icons/Superscript.vue";
import Underline from "@/components/icons/Underline.vue";
import Undo from "@/components/icons/Undo.vue";

const data = [
  { name: "历史", icons: [Undo, Redo] },
  {
    name: "文字",
    icons: [
      Bold,
      Italic,
      Underline,
      Strike,
      Superscript,
      Subscript,
      InlineCode,
      Highlight,
    ],
  },
  { name: "段落", icons: [LetterT, H1, H2, H3, H4, H5, H6] },
  { name: "插入", icons: [Link, CodeBlock, Image, Math, Quote] },
  { name: "对齐", icons: [AlignLeft, AlignCenter, AlignRight, AlignJustify] },
];
</script>

<template>
  <div class="sticky top-0 h-10 bg-gray-100 flex items-center">
    <div v-for="list in data" class="flex h-full items-center">
      <div
        v-for="i in list.icons"
        class="w-7 h-7 rounded-md grid place-items-center mx-0.5 hover:bg-gray-200"
      >
        <component :is="i" class="w-5 h-5" />
      </div>
      <div class="h-1/3 border-x text-neutral-300 mx-1"></div>
    </div>
  </div>
</template>
