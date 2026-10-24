<script setup lang="ts">
import MinimizeBtn from "./MinimizeBtn.vue";
import MaximizeBtn from "./MaximizeBtn.vue";
import CloseBtn from "./CloseBtn.vue";
import Side from "@/components/icons/Side.vue";
import SideMian from "@/components/icons/SideMian.vue";
import { useUiStore } from "@/stores/uiStore.ts";
import Setting from "@/components/icons/Setting.vue";

const uiStore = useUiStore();

interface Props {
  label: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="h-10 flex items-center pl-1.5 select-none">
    <div
      v-if="label === 'editor' && uiStore.editorMode === 'archive'"
      class="flex gap-2 bg-white p-1 rounded-md"
    >
      <div
        class="px-2 rounded-sm"
        @click="uiStore.setLeftbarOption('docEntries')"
        :class="uiStore.leftbarOption === 'docEntries' ? 'bg-gray-200' : ''"
      >
        目录
      </div>
      <div
        class="px-2 rounded-sm"
        @click="uiStore.setLeftbarOption('toc')"
        :class="uiStore.leftbarOption === 'toc' ? 'bg-gray-200' : ''"
      >
        大纲
      </div>
    </div>
    <div class="flex-1 h-full flex items-center desktop-draggable"></div>
    <div
      v-if="label === 'editor'"
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
      v-if="label === 'main'"
      class="size-7 hover:bg-gray-100 grid place-items-center rounded-md"
      @click="uiStore.toggleRightbar"
    >
      <Setting class="size-5" />
    </div>
    <MinimizeBtn />
    <MaximizeBtn />
    <CloseBtn />
  </div>
</template>
