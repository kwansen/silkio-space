<script setup lang="ts">
import ChevronDown from "@/components/icons/ChevronDown.vue";
import ChevronUp from "@/components/icons/ChevronUp.vue";
import Close from "@/components/icons/Close.vue";
import CaseSensitive from "@/components/icons/CaseSensitive.vue";
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
    icon: CaseSensitive,
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
  <div class="bg-white p-4 rounded-lg shadow-2xl select-none relative w-80">
    <FocusScope autofocus>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium text-gray-700">搜索与替换</div>
          <div
            @click="emit('close')"
            class="grid place-items-center size-6 rounded-md cursor-pointer text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Close class="size-4" />
          </div>
        </div>

        <div
          class="flex rounded-md items-center px-1.5 gap-1 bg-gray-100 focus-within:ring-1 focus-within:ring-purple-300"
        >
          <input
            type="text"
            placeholder="搜索"
            class="flex-1 h-9 bg-gray-100 outline-none text-sm"
            v-model="searchTerm"
          />
          <div
            v-for="item in list"
            @click="item.action"
            class="size-7 grid place-items-center rounded-md cursor-pointer"
            :class="
              item.state()
                ? 'bg-purple-100 text-purple-600'
                : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'
            "
          >
            <component :is="item.icon" class="size-4" />
          </div>
        </div>
        <div
          class="px-1.5 focus-within:ring-1 focus-within:ring-purple-300 rounded-md bg-gray-100"
        >
          <input
            v-model="replaceTerm"
            type="text"
            placeholder="替换为"
            class="w-full h-9 outline-none text-sm"
          />
        </div>
        <div class="flex items-center gap-2 pt-1">
          <button
            class="h-8 px-3 bg-white rounded-md border border-purple-300 text-purple-600 text-xs cursor-pointer hover:bg-purple-50"
            @click="editor?.commands.replace()"
          >
            替换
          </button>
          <button
            class="h-8 px-3 bg-purple-500 rounded-md text-white text-xs cursor-pointer hover:bg-purple-400"
            @click="editor?.commands.replaceAll()"
          >
            全部替换
          </button>
          <div class="flex-1"></div>
          <button
            class="size-8 grid place-items-center rounded-md text-gray-500 cursor-pointer hover:bg-gray-100 hover:text-gray-700"
            @click="editor?.commands.goToPreviousResult()"
          >
            <ChevronUp class="size-5" />
          </button>
          <button
            class="size-8 grid place-items-center rounded-md text-gray-500 cursor-pointer hover:bg-gray-100 hover:text-gray-700"
            @click="editor?.commands.goToNextResult()"
          >
            <ChevronDown class="size-5" />
          </button>
        </div>
      </div>
    </FocusScope>
  </div>
</template>
