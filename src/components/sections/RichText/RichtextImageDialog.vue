<script setup lang="ts">
import { FocusScope } from "@zhencai/vue-focus-scope";
import RTImageOnline from "./RTImageOnline.vue";
import RTImageLocal from "./RTImageLocal.vue";
import { Editor } from "@tiptap/vue-3";
import { ref } from "vue";

interface Props {
  editor: Editor | undefined;
}
const props = defineProps<Props>();

const isOnline = ref(true);
</script>

<template>
  <FocusScope
    class="inset-0 bg-black/10 fixed grid place-items-center"
    autofocus
  >
    <div class="w-lg px-10 pt-10 pb-4 bg-white rounded-lg">
      <div class="flex gap-4 select-none">
        <div @click="isOnline = true">
          在线图片
          <div
            class="h-1 rounded-full"
            :class="isOnline ? 'bg-purple-200' : ''"
          ></div>
        </div>
        <div @click="isOnline = false">
          本地图片
          <div
            class="h-1 rounded-full"
            :class="isOnline ? '' : 'bg-purple-200'"
          ></div>
        </div>
      </div>
      <RTImageOnline :editor="editor" v-if="isOnline" />
      <RTImageLocal :editor="editor" v-else /></div
  ></FocusScope>
</template>
