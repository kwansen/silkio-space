<script setup lang="ts">
import Close from "@/components/icons/Close.vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";
import { FocusScope } from "@zhencai/vue-focus-scope";
import About from "./About.vue";
import Common from "./Common.vue";
import Shortcut from "./Shortcut.vue";
import Sync from "./Sync.vue";
import { ref } from "vue";

type NavKey = "common" | "shortcut" | "sync" | "about";

const navList: { key: NavKey; show: string }[] = [
  { key: "common", show: "通用" },
  { key: "shortcut", show: "快捷键" },
  { key: "sync", show: "同步" },
  { key: "about", show: "关于" },
];

const nav = ref<NavKey>("common");
</script>

<template>
  <div class="fixed inset-0 bg-black/10 grid place-items-center select-none">
    <FocusScope
      class="w-full max-w-2xl h-180 bg-white rounded-2xl flex flex-col"
    >
      <div
        class="h-16 flex items-center justify-between px-4 text-2xl border-b border-purple-300"
      >
        设置
        <div
          class="size-7 hover:bg-red-200 hover:text-white grid place-items-center rounded-full"
        >
          <Close class="size-5" />
        </div>
      </div>
      <div class="flex-1 flex">
        <div class="w-65 h-full bg-gray-100 p-2">
          <div
            v-for="item in navList"
            class="py-2 px-4 rounded-md"
            :class="item.key === nav ? 'bg-purple-200' : 'hover:bg-gray-200 '"
            @click="nav = item.key"
          >
            {{ item.show }}
          </div>
        </div>
        <div class="flex-1">
          <ScrollArea class="p-4">
            <Sync v-if="nav === 'sync'" />
            <Shortcut v-if="nav === 'shortcut'" />
            <Common v-if="nav === 'common'" />
            <About v-if="nav === 'about'" />
          </ScrollArea>
        </div>
      </div>
    </FocusScope>
  </div>
</template>
