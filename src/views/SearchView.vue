<script setup lang="ts">
import { useDocAction } from "@/actions/docAction";
import Doc from "@/components/icons/Doc.vue";
import { useDocSearchStore } from "@/stores/docSearchStore";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { onKeyStroke, useResizeObserver } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed, nextTick, watch } from "vue";
import { onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import Search from "@/components/icons/Search.vue";
import { getCurrentWebview } from "@tauri-apps/api/webview";
const store = useDocSearchStore();
const { setPageSize, setDocs, setQuery } = store;
const {
  query,
  searchedDocs,
  currentPage,
  docsThisPage,
  totalPages,
  activeIndex,
} = storeToRefs(store);
const action = useDocAction();

// ESC 关闭
onKeyStroke("Escape", () => {
  getCurrentWindow().hide();
});

const heights = [112, 176, 240, 304, 368, 432, 496, 560, 624];
let target = 0;

onKeyStroke("ArrowDown", async (event) => {
  event.preventDefault();
  // target++;
  // const height = heights[target % 9];
  action.activateSearchedNext();
  // await getCurrentWindow().setSize(new LogicalSize(720, height));
});

onKeyStroke("ArrowUp", (event) => {
  event.preventDefault();
  action.activateSearchedPrev();
});

let stopOnFocus: (() => void) | null = null;

const input = useTemplateRef("input");
const isLoading = ref(false);

watch(
  () => query.value,
  async (v) => {
    if (v) {
      isLoading.value = true;
      await action.searchDocs(v);
      isLoading.value = false;
    } else {
      setDocs([]);
    }
  },
);

// 单行高度 / 容器上下 padding 之和
const ROW_HEIGHT = 64;
const PADDING_Y = 48;

const height = computed(() => {
  const length = docsThisPage.value.length;
  const hasQuery = !!query.value?.trim();

  // 行数：基础输入框 1 行
  // - 有内容：输入框 + 内容列表 + 底部帮助
  // - 空列表 + 有查询词：加载中(仅输入框) 或 无结果提示(输入框 + 提示)
  // - 空列表 + 无查询词：仅输入框
  let rows: number;
  if (length > 0) {
    rows = length + 2;
  } else if (hasQuery) {
    rows = 2;
  } else {
    rows = 1;
  }

  return rows * ROW_HEIGHT + PADDING_Y;
});
const box = useTemplateRef("box");

let lastHeight = 0;
let resizing = false;

useResizeObserver(box, async (entries) => {
  const height = Math.ceil(entries[0].contentRect.height);

  if (resizing || height === lastHeight) {
    return;
  }

  resizing = true;
  lastHeight = height;

  try {
    await getCurrentWindow().setSize(new LogicalSize(720, height));
  } finally {
    resizing = false;
  }
});

onMounted(async () => {
  setPageSize(7);
  // getCurrentWindow().setSize(new LogicalSize(720, 640));
  const webview = getCurrentWebview();

  await webview.setAutoResize(false);
  stopOnFocus = await getCurrentWindow().onFocusChanged(
    ({ payload: focused }) => {
      if (focused) {
        input.value?.focus();
      } else {
        getCurrentWindow().hide();
        setQuery("");
      }
    },
  );
});

onUnmounted(() => {
  stopOnFocus?.();
});
</script>

<template>
  <div ref="box" class="w-180 px-6 select-none">
    <div class="h-6"></div>
    <div
      class="bg-white rounded-2xl overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.1)]"
    >
      <div class="flex">
        <div class="size-16 grid place-items-center">
          <Search class="size-5" />
        </div>
        <input
          ref="input"
          type="text"
          name=""
          id=""
          v-model="query"
          class="h-16 flex-1 pr-4 outline-none"
        />
      </div>

      <div
        class="h-16 border-t border-gray-100 grid place-items-center text-neutral-400"
        v-if="docsThisPage.length === 0 && !!query?.trim()"
      >
        无匹配的文档，请更换关键词
      </div>
      <div
        v-if="docsThisPage.length > 0"
        v-for="(d, index) in docsThisPage"
        class="h-16 flex items-center px-4 border-t border-gray-100 cursor-pointer"
        :class="
          activeIndex % 7 === index ? 'bg-purple-100' : 'hover:bg-gray-100'
        "
      >
        <div class="size-8 bg-gray-50 grid place-items-center rounded-md">
          <doc class="size-5" v-if="d.doc_type === 'richText'" />
          <flowchart class="size-5" v-if="d.doc_type === 'flowChart'" />
          <mindmap class="size-5" v-if="d.doc_type === 'mindMap'" />
        </div>
        <div class="flex-1 px-4 min-w-0">
          <div class="truncate">
            {{ d.title }}
          </div>
          <div class="truncate text-xs text-neutral-400 mt-0.5">
            {{ d.plain_text }}
          </div>
        </div>
        <div class="text-neutral-300 text-xs">Ctrl + {{ index + 1 }}</div>
      </div>
      <div
        v-if="docsThisPage.length > 0"
        class="h-16 border-t border-gray-100 flex items-center gap-4 px-4 text-xs text-neutral-300"
      >
        <span>↑↓ 选择</span>
        <span>↵ 打开</span>
        <span>Esc 关闭</span>
        <span>PgUp/PgDn 翻页</span>
        <span>Ctrl+1~7 快速打开</span>
        <div class="flex-1"></div>
        <span>{{ currentPage }}/{{ totalPages }}</span>
      </div>
    </div>
    <div class="h-6"></div>
  </div>
</template>
