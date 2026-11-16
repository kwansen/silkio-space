<script setup lang="ts">
import MinimizeBtn from "./MinimizeBtn.vue";
import MaximizeBtn from "./MaximizeBtn.vue";
import CloseBtn from "./CloseBtn.vue";
import Side from "@/components/icons/Side.vue";
import SideMian from "@/components/icons/SideMian.vue";
import { useUiStore } from "@/stores/uiStore.ts";
import Setting from "@/components/icons/Setting.vue";
import { useEditorStore } from "@/stores/editorStore.ts";

const uiStore = useUiStore();
const editorStore = useEditorStore();

interface Props {
  label: string;
}

defineProps<Props>();
</script>

<template>
  <div class="h-10 flex items-center pl-1.5 select-none">
    <!-- 必须是编辑器窗口的archive模式以及有激活的id -->
    <div
      v-if="
        label === 'editor' && editorStore.editorMode === 'archive' && editorStore.id
      "
      class="flex gap-1 bg-white p-0.5 rounded-md"
    >
      <div
        class="px-2 rounded-sm cursor-pointer"
        @click="uiStore.setLeftbarOption('docEntries')"
        :class="
          uiStore.leftbarOption === 'docEntries'
            ? 'bg-purple-200'
            : 'hover:bg-gray-100'
        "
      >
        目录
      </div>
      <div
        class="px-2 rounded-sm cursor-pointer"
        @click="uiStore.setLeftbarOption('toc')"
        :class="
          uiStore.leftbarOption === 'toc'
            ? 'bg-purple-200'
            : 'hover:bg-gray-100'
        "
      >
        大纲
      </div>
    </div>
    <div class="flex-1 h-full flex items-center desktop-draggable"></div>
    <!-- 左侧栏切换：仅在左侧栏有内容可显示时出现（与 EditorView 同源判定），
         flowChart/mindMap 的 doc 模式下无目录也无大纲，隐藏避免无效交互 -->
    <div
      v-if="label === 'editor' && editorStore.leftbarApplicable"
      class="size-7 hover:bg-gray-100 grid place-items-center rounded-md"
      @click="uiStore.toggleLeftbar"
    >
      <SideMian v-if="uiStore.showLeftbar" class="size-5" />
      <Side v-else class="size-5 rotate-180" />
    </div>
    <div
      v-if="label === 'editor'"
      class="size-7 hover:bg-gray-100 grid place-items-center rounded-md"
      @click="uiStore.toggleRightbar"
    >
      <SideMian v-if="uiStore.showRightbar" class="size-5 rotate-180" />
      <Side v-else class="size-5" />
    </div>
    <div
      v-if="label === 'main' || label === 'editor'"
      class="size-7 hover:bg-gray-100 grid place-items-center rounded-md"
      @click="uiStore.setSettingDialogShow(true)"
    >
      <Setting class="size-5" />
    </div>
    <MinimizeBtn />
    <MaximizeBtn />
    <CloseBtn />
  </div>
</template>
