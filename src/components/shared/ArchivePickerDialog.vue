<script setup lang="ts">
import { FocusScope } from "@zhencai/vue-focus-scope";
import ScrollArea from "./ScrollArea.vue";
import CheckSquareFill from "../icons/CheckSquareFill.vue";
import { onMounted, ref } from "vue";
import { useArchiveAction } from "@/actions/archiveAction.ts";
import { CheckedArchive } from "@/types/archive.ts";
import Square from "../icons/Square.vue";

interface Props {
  id: string;
}

const props = defineProps<Props>();

const action = useArchiveAction();

const archives = ref<CheckedArchive[]>([]);

onMounted(async () => {
  archives.value = await action.checkArchives(props.id);
});

const store = useUiStore();

const close = () => {
  store.setOpenId("");
};

const handleClick = async () => {
  const ids = archives.value.filter((a) => a.checked === true).map((a) => a.id);
  await action.addDocToArchives(props.id, ids);
  close();
};

import { onKeyStroke } from "@vueuse/core";
import { useUiStore } from "@/stores/uiStore.ts";

// ESC 关闭
onKeyStroke("Escape", () => {
  close();
});

// 回车
onKeyStroke("Enter", () => {
  handleClick();
});
</script>

<template>
  <div class="fixed inset-0 grid place-items-center bg-black/10">
    <FocusScope
      class="w-100 h-100 bg-white rounded-2xl flex flex-col overflow-hidden"
    >
      <div class="flex-1 min-h-0">
        <ScrollArea class="py-2">
          <!-- 无归档时的空提示 -->
          <div
            v-if="!archives.length"
            class="mt-20 text-center text-xs text-gray-400"
          >
            暂无归档，请先在主页创建
          </div>
          <div v-for="a in archives" class="px-2 h-10">
            <div
              class="h-10 hover:bg-gray-100 rounded-md flex px-2 gap-2 items-center cursor-pointer"
              @click="a.checked = !a.checked"
            >
              <CheckSquareFill
                v-if="a.checked"
                class="size-5 text-purple-700"
              />
              <Square v-else class="size-5" />
              <span>{{ a.name }}</span>
            </div>
          </div>
        </ScrollArea>
      </div>

      <div class="flex justify-end gap-2 p-4">
        <button
          class="h-9 bg-gray-100 px-4 rounded-md cursor-pointer"
          @click="close"
        >
          取消
        </button>
        <button
          :disabled="!archives.some((a) => a.checked)"
          class="h-9 bg-purple-500 px-4 rounded-md text-white cursor-pointer disabled:bg-purple-200 disabled:cursor-default"
          @click="handleClick"
        >
          确认
        </button>
      </div>
    </FocusScope>
  </div>
</template>
