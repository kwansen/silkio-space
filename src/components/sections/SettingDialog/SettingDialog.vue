<script setup lang="ts">
import Close from "@/components/icons/Close.vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";
import { FocusScope } from "@zhencai/vue-focus-scope";
import About from "./About.vue";
import AI from "./AI.vue";
import Common from "./Common.vue";
import Shortcut from "./Shortcut.vue";
import Sync from "./Sync.vue";
import { computed } from "vue";
import { useUiStore } from "@/stores/uiStore.ts";

type NavKey = "common" | "ai" | "shortcut" | "sync" | "about";

const navList: { key: NavKey; show: string }[] = [
  { key: "common", show: "通用" },
  { key: "ai", show: "AI 服务" },
  { key: "shortcut", show: "快捷键" },
  { key: "sync", show: "同步" },
  { key: "about", show: "关于" },
];

const navKeys: string[] = navList.map((n) => n.key);

// 页签状态放 uiStore：其他组件（如 AI 面板齿轮）可直达指定页签
const uiStore = useUiStore();
const nav = computed<NavKey>({
  get: () =>
    (navKeys.includes(uiStore.settingNav)
      ? uiStore.settingNav
      : "common") as NavKey,
  set: (v) => uiStore.setSettingNav(v),
});

const close = () => {
  uiStore.setSettingDialogShow(false);
};
</script>

<template>
  <div class="fixed inset-0 bg-black/10 grid place-items-center select-none">
    <FocusScope
      class="w-full max-w-2xl h-120 bg-white rounded-2xl overflow-hidden flex flex-col"
    >
      <div
        class="h-16 text-lg shrink-0 flex items-center justify-between px-4 font-medium border-b border-purple-300"
      >
        设置
        <div
          @click="close"
          class="size-7 grid place-items-center rounded-md cursor-pointer text-gray-500 hover:bg-red-100 hover:text-red-600"
        >
          <!-- 关闭按钮统一规格：hover 图标变红 + 浅红底；16 网格像素图标按整数倍缩放 -->
          <Close class="size-4" />
        </div>
      </div>
      <div class="flex-1 flex">
        <div class="w-65 h-full bg-gray-100 p-2">
          <div
            v-for="item in navList"
            class="py-2 px-4 rounded-md cursor-pointer"
            :class="item.key === nav ? 'bg-purple-200' : 'hover:bg-gray-200 '"
            @click="nav = item.key"
          >
            {{ item.show }}
          </div>
        </div>
        <div class="flex-1 bg-gray-50">
          <ScrollArea class="p-4">
            <Sync v-if="nav === 'sync'" />
            <Shortcut v-if="nav === 'shortcut'" />
            <Common v-if="nav === 'common'" />
            <AI v-if="nav === 'ai'" />
            <About v-if="nav === 'about'" />
          </ScrollArea>
        </div>
      </div>
    </FocusScope>
  </div>
</template>
