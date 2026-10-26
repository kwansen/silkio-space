<script setup lang="ts">
import { useSettingStore } from "@/stores/settingStore.ts";
import ShortcutItem from "./ShortcutItem.vue";
import { storeToRefs } from "pinia";
import { computed, watch } from "vue";
import {
  isRegistered,
  register,
  unregister,
} from "@tauri-apps/plugin-global-shortcut";
import { shortcutToRegister } from "@/utils/shortcut.ts";
import { Window } from "@tauri-apps/api/window";

const settingStore = useSettingStore();
const { openSearchWindow, openToolWindow } = storeToRefs(settingStore);

const search = computed(() => shortcutToRegister(openSearchWindow.value));
const tool = computed(() => shortcutToRegister(openToolWindow.value));

const showWindow = async (label: string) => {
  const win = await Window.getByLabel(label);
  if (!win) return;
  win.unminimize();
  win.show();
  win.setFocus();
};

watch(
  () => search.value,
  async (nv, ov) => {
    if (nv && nv !== ov) {
      try {
        if (await isRegistered(ov)) {
          await unregister(ov);
        }
        await register(nv, () => showWindow("search"));
      } catch (e) {
        console.error(e);
      }
    }
  },
);

watch(
  () => tool.value,
  async (nv, ov) => {
    if (nv && nv !== ov) {
      try {
        if (await isRegistered(ov)) {
          await unregister(ov);
        }
        await register(nv, () => showWindow("tool"));
      } catch (e) {
        console.error(e);
      }
    }
  },
);
</script>
<template>
  <ShortcutItem v-model="openSearchWindow" label="快捷搜索文档" />
  <ShortcutItem v-model="openToolWindow" label="快捷创建文档" />
</template>
