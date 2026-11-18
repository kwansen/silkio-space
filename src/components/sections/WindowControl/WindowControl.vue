<script setup lang="ts">
import MinimizeBtn from "./MinimizeBtn.vue";
import MaximizeBtn from "./MaximizeBtn.vue";
import CloseBtn from "./CloseBtn.vue";
import PixelAlign from "@/components/shared/PixelAlign.vue";
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
        label === 'editor' &&
        editorStore.editorMode === 'archive' &&
        editorStore.id
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
    <div class="flex-1 h-full flex items-center desktop-draggable">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        class="size-4 text-black"
      >
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        class="size-4 text-black"
      >
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        class="size-4 text-black"
      >
        <rect
          x="1"
          y="1"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        class="size-6 text-black"
      >
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        class="size-6 text-black"
      >
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        class="size-6 text-black"
      >
        <rect
          x="1"
          y="1"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
      </svg>
    </div>
    <!-- 左侧栏切换：仅在左侧栏有内容可显示时出现（与 EditorView 同源判定），
         flowChart/mindMap 的 doc 模式下无目录也无大纲，隐藏避免无效交互 -->
    <div
      v-if="label === 'editor' && editorStore.leftbarApplicable"
      class="size-7 hover:bg-gray-100 grid place-items-center rounded-md"
      title="目录 / 大纲"
      @click="uiStore.toggleLeftbar"
    >
      <!-- 图标反映实际可见状态（含窄窗口自动隐藏） -->
      <PixelAlign v-if="uiStore.showLeftbar && uiStore.leftbarFits">
        <SideMian />
      </PixelAlign>
      <PixelAlign v-else><Side class="rotate-180" /></PixelAlign>
    </div>
    <div
      v-if="label === 'editor'"
      class="size-7 hover:bg-gray-100 grid place-items-center rounded-md"
      title="AI 助手"
      @click="uiStore.toggleRightbar"
    >
      <PixelAlign v-if="uiStore.showRightbar && uiStore.rightbarFits">
        <SideMian class="rotate-180" />
      </PixelAlign>
      <PixelAlign v-else><Side /></PixelAlign>
    </div>
    <!-- 设置入口仅保留在 main 窗口；editor 窗口经 AI 面板齿轮触达 AI 配置 -->
    <div
      v-if="label === 'main'"
      class="size-7 hover:bg-gray-100 grid place-items-center rounded-md"
      @click="uiStore.setSettingDialogShow(true)"
    >
      <PixelAlign><Setting /></PixelAlign>
    </div>
    <MinimizeBtn />
    <MaximizeBtn />
    <CloseBtn />
  </div>
</template>
