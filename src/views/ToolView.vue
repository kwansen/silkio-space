<script setup lang="ts">
import { useDocAction } from "@/actions/docAction";
import DocIcon from "@/components/icons/Doc.vue";
import FlowchartIcon from "@/components/icons/Flowchart.vue";
import MindmapIcon from "@/components/icons/Mindmap.vue";
import type { DocType } from "@/types/doc";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onMounted, onUnmounted, type Component } from "vue";

const action = useDocAction();

interface CreateItem {
  docType: DocType;
  icon: Component;
  text: string;
}

// 数字键 1~3 与条目顺序一一对应
const items: CreateItem[] = [
  { docType: "richText", icon: DocIcon, text: "富文本" },
  { docType: "mindMap", icon: MindmapIcon, text: "思维导图" },
  { docType: "flowChart", icon: FlowchartIcon, text: "流程图" },
];

// 创建对应类型文档后隐藏本窗口：
// 不广播 doc:changed（同 docAction 策略），main 的刷新由 editor 就绪显示后补发
const create = async (item: CreateItem) => {
  await action.createTyped(item.docType);
  getCurrentWindow().hide();
};

// 键盘处理：数字 1~3（主键区/小键盘）快速创建，Esc 关闭
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    getCurrentWindow().hide();
    return;
  }
  const digit = /^(Digit|Numpad)([1-3])$/.exec(event.code);
  if (digit) {
    event.preventDefault();
    create(items[Number(digit[2]) - 1]);
  }
};

// 窗口固定尺寸（创建时 240x192）且透明，卡片固定居中，点击卡片外即关闭
const onDocPointerDown = (e: PointerEvent) => {
  if (!(e.target as HTMLElement | null)?.closest("[data-card]")) {
    getCurrentWindow().hide();
  }
};

let stopOnFocus: (() => void) | null = null;

onMounted(async () => {
  window.addEventListener("keydown", handleKeyDown);
  stopOnFocus = await getCurrentWindow().onFocusChanged(
    ({ payload: focused }) => {
      if (!focused) {
        getCurrentWindow().hide();
      }
    },
  );
  document.addEventListener("pointerdown", onDocPointerDown);
});

onUnmounted(() => {
  stopOnFocus?.();
  window.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("pointerdown", onDocPointerDown);
});
</script>

<template>
  <div class="w-72 px-6 py-6 select-none">
    <div
      data-card
      class="bg-white rounded-lg overflow-hidden p-1 shadow-[0_0_8px_rgba(0,0,0,0.12)] space-y-1"
    >
      <div
        v-for="(item, index) in items"
        class="pl-4 pr-3 h-12 flex items-center gap-3 rounded-md hover:bg-gray-100 cursor-pointer"
        @click="create(item)"
      >
        <component :is="item.icon" class="size-5 shrink-0" />
        <span class="flex-1">{{ item.text }}</span>
        <span class="text-neutral-300 text-xs">{{ index + 1 }}</span>
      </div>
      <div
        class="border-t border-gray-100 h-8 px-3 flex items-center gap-3 text-xs text-neutral-300"
      >
        <span>1~3 创建</span>
        <span>Esc 关闭</span>
      </div>
    </div>
  </div>
</template>
