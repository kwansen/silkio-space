<script setup lang="ts">
import MinimizeBtn from "./MinimizeBtn.vue";
import MaximizeBtn from "./MaximizeBtn.vue";
import CloseBtn from "./CloseBtn.vue";
import Side from "@/components/icons/Side.vue";
import SideMian from "@/components/icons/SideMian.vue";
import { useUiStore } from "@/stores/uiStore.ts";

const uiStore = useUiStore();

interface Props {
  label: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="h-10 flex items-center">
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
    <MinimizeBtn />
    <MaximizeBtn />
    <CloseBtn />
  </div>
</template>
