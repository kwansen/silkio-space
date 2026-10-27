<script setup lang="ts">
import { useDocAction } from "@/actions/docAction";
import Doc from "@/components/icons/Doc.vue";
import { useDocSearchStore } from "@/stores/docSearchStore";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onKeyStroke } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { watch } from "vue";
import { onMounted, onUnmounted, ref, useTemplateRef } from "vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import Search from "@/components/icons/Search.vue";
const store = useDocSearchStore();
const { setPageSize, setDocs, setQuery } = store;
const { query, currentPage, docsThisPage, totalPages, activeIndex } =
  storeToRefs(store);
const action = useDocAction();

// ESC 关闭
onKeyStroke("Escape", () => {
  getCurrentWindow().hide();
});

onKeyStroke("ArrowDown", async (event) => {
  event.preventDefault();
  action.activateSearchedNext();
});

onKeyStroke("ArrowUp", (event) => {
  event.preventDefault();
  action.activateSearchedPrev();
});

onKeyStroke("PageUp", (event) => {
  event.preventDefault();
  action.goSearchedPrev();
});

onKeyStroke("PageDown", (event) => {
  event.preventDefault();
  action.goSearchedNext();
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

// 窗口固定尺寸（创建时 720x800），不做动态 resize：
// Windows + WebView2 上任何可见期间的 setSize 都会让 webview 表面按新尺寸
// 重建/重新合成，新帧就绪前的空帧就是闪烁，JS 侧无法消除。
// 卡片固定顶部，下方为透明区域，点击卡片外即关闭。
const onDocPointerDown = (e: PointerEvent) => {
  if (!(e.target as HTMLElement | null)?.closest("[data-card]")) {
    getCurrentWindow().hide();
  }
};

onMounted(async () => {
  setPageSize(7);
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
  document.addEventListener("pointerdown", onDocPointerDown);
});

onUnmounted(() => {
  stopOnFocus?.();
  document.removeEventListener("pointerdown", onDocPointerDown);
});
</script>

<template>
  <div class="w-180 px-6 select-none">
    <div class="h-6"></div>
    <div
      data-card
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
            {{ d.title || "未命名标题" }}
          </div>
          <div class="truncate text-xs text-neutral-400 mt-0.5">
            {{ d.plain_text?.trim() || "暂无内容" }}
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
