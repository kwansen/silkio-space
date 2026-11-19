<script setup lang="ts">
import ArrowDown from "@/components/icons/ArrowDown.vue";
import ArrowTop from "@/components/icons/ArrowTop.vue";
import CloseSmall from "@/components/icons/CloseSmall.vue";
import MatchCase from "@/components/icons/MatchCase.vue";
import Regex from "@/components/icons/Regex.vue";
import WholeWord from "@/components/icons/WholeWord.vue";
import { Editor } from "@tiptap/vue-3";
import { FocusScope } from "@zhencai/vue-focus-scope";
import { type Component, onUnmounted, ref, watch } from "vue";

interface Props {
  editor: Editor | undefined;
}

const props = defineProps<Props>();

const emit = defineEmits<{ close: [] }>();

const searchTerm = ref("");
const replaceTerm = ref("");

watch(
  () => searchTerm.value,
  (v) => {
    props.editor?.commands.setSearchTerm(v);
  },
);

watch(
  () => replaceTerm.value,
  (v) => {
    props.editor?.commands.setReplaceTerm(v);
  },
);

const caseSensitive = ref(false);
const wholeWord = ref(false);
const useRegex = ref(false);
const setCaseSensitive = () => {
  const v = !caseSensitive.value;
  caseSensitive.value = v;
  props.editor?.commands.setCaseSensitive(v);
};

const setWholeWord = () => {
  const v = !wholeWord.value;
  wholeWord.value = v;
  props.editor?.commands.setWholeWord(v);
};

const setUseRegex = () => {
  const v = !useRegex.value;
  useRegex.value = v;
  props.editor?.commands.setUseRegex(v);
};

interface Item {
  icon: Component;
  state: () => boolean;
  action: () => void;
}

const list: Item[] = [
  {
    icon: MatchCase,
    state: () => caseSensitive.value,
    action: setCaseSensitive,
  },
  { icon: WholeWord, state: () => wholeWord.value, action: setWholeWord },
  { icon: Regex, state: () => useRegex.value, action: setUseRegex },
];

onUnmounted(() => {
  props.editor?.commands.setSearchTerm("");
});
</script>
<template>
  <div class="bg-white p-4 rounded-lg shadow-2xl select-none relative">
    <FocusScope autofocus>
      <div class="space-y-4">
        <div class="flex justify-end">
          <div
            @click="emit('close')"
            class="grid place-items-center size-6 bg-gray-200 rounded-md cursor-pointer text-gray-500 hover:bg-red-50 hover:text-red-500"
          >
            <CloseSmall class="size-3.5" />
          </div>
        </div>

        <div
          class="flex rounded-md items-center px-1 bg-gray-100 focus-within:ring focus-within:ring-purple-300"
        >
          <input
            type="text"
            class="w-40 h-9 bg-gray-100 outline-none pl-1"
            v-model="searchTerm"
          />
          <div class="w-1"></div>
          <div
            v-for="item in list"
            @click="item.action"
            class="size-5 grid place-items-center mr-1 rounded-xs"
            :class="item.state() ? 'bg-purple-200' : 'hover:bg-gray-200'"
          >
            <component :is="item.icon" class="size-4" />
          </div>
        </div>
        <div
          class="px-1 focus-within:ring focus-within:ring-purple-300 rounded-md bg-gray-100"
        >
          <input
            v-model="replaceTerm"
            type="text"
            class="w-full h-9 px-1 outline-none"
          />
        </div>
        <div class="flex">
          <div
            class="w-20 bg-purple-200 rounded-l-md text-center py-1"
            @click="editor?.commands.replace()"
          >
            替换
          </div>
          <div
            class="w-20 bg-purple-400 rounded-r-md text-white text-center py-1"
            @click="editor?.commands.replaceAll()"
          >
            全部替换
          </div>
          <div class="flex-1"></div>
          <div
            class="size-7 grid place-items-center hover:bg-gray-100 mr-2 rounded-md"
            @click="editor?.commands.goToPreviousResult()"
          >
            <ArrowTop class="size-5" />
          </div>

          <div
            class="size-7 grid place-items-center hover:bg-gray-100 rounded-md"
            @click="editor?.commands.goToNextResult()"
          >
            <ArrowDown class="size-5" />
          </div>
        </div>
      </div>
    </FocusScope>
  </div>
</template>
