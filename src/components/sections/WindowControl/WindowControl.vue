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
    <!-- 必须是编辑器窗口的archive模式、有激活的id且当前是富文本（tocApplicable）：
         切换按钮的意义在于目录/大纲互切，思维导图/流程图没有大纲，单挂一个
         「目录」tab 没有交互意义，整组隐藏 -->
    <div
      v-if="
        label === 'editor' &&
        editorStore.editorMode === 'archive' &&
        editorStore.id &&
        editorStore.tocApplicable
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
      class="size-8 hover:bg-gray-100 grid place-items-center rounded-md"
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
      class="size-8 hover:bg-gray-100 grid place-items-center rounded-md"
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
      class="size-8 hover:bg-gray-100 grid place-items-center rounded-md"
      @click="uiStore.setSettingDialogShow(true)"
    >
      <Setting class="size-5" />
    </div>
    <MinimizeBtn />
    <MaximizeBtn />
    <CloseBtn />
  </div>
</template>
