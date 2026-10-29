<script setup lang="ts">
import { useArchiveAction } from "@/actions/archiveAction";
import { useDocAction } from "@/actions/docAction";
import ArchiveSearch from "@/components/sections/ArchiveSearch/ArchiveSearch.vue";
import ArchiveSort from "@/components/sections/ArchiveSort/ArchiveSort.vue";
import DocSearch from "@/components/sections/DocSearch/DocSearch.vue";
import DocSort from "@/components/sections/DocSort/DocSort.vue";
import DocTabs from "@/components/sections/DocTabs/DocTabs.vue";
import SettingDialog from "@/components/sections/SettingDialog/SettingDialog.vue";
import ArchivePickerDialog from "@/components/shared/ArchivePickerDialog.vue";
import ScrollArea from "@/components/shared/ScrollArea.vue";
import { useUiStore } from "@/stores/uiStore";
import { useSettingStore } from "@/stores/settingStore.ts";
import { shortcutToRegister } from "@/utils/shortcut.ts";
import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { Window } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { storeToRefs } from "pinia";
import { onMounted, onUnmounted } from "vue";

const store = useUiStore();
const { docTab: tab } = storeToRefs(store);
const docAction = useDocAction();
const archiveAction = useArchiveAction();
const settingStore = useSettingStore();

let stopOnDataChanged: (() => void) | null = null;

const showWindow = async (label: string) => {
  const win = await Window.getByLabel(label);
  if (!win) return;
  win.unminimize();
  win.show();
  win.setFocus();
};

onMounted(async () => {
  // 挂载时获取文档
  await docAction.refreshSorted();
  // 挂载时获取归档
  await archiveAction.refresh();

  // 挂载时注册全局快捷键
  await unregisterAll();
  await register(shortcutToRegister(settingStore.openSearchWindow), () =>
    showWindow("search"),
  );
  await register(shortcutToRegister(settingStore.openToolWindow), () =>
    showWindow("tool"),
  );

  // 数据事实统一入口：任何写操作后失效本地缓存，重查文档与归档列表
  const refreshViews = async () => {
    await docAction.refreshAll();
    await archiveAction.refresh();
  };
  stopOnDataChanged = await listen("data:changed", refreshViews);
});

onUnmounted(() => {
  stopOnDataChanged?.();
});
</script>

<template>
  <div class="w-full h-full flex">
    <div class="w-10 h-full">
      <DocTabs />
    </div>
    <div class="flex-1 pr-2 pb-2">
      <ScrollArea class="bg-gray-50 rounded-lg">
        <div class="py-14 w-full max-w-176 mx-auto">
          <div class="bg-white rounded-2xl overflow-hidden">
            <DocSort v-if="tab === 'docSort'" />
            <DocSearch v-if="tab === 'docSearch'" />
            <ArchiveSort v-if="tab === 'archiveSort'" />
            <ArchiveSearch v-if="tab === 'archiveSearch'" />
          </div>
        </div>
      </ScrollArea>
    </div>
  </div>
  <ArchivePickerDialog v-if="store.openId" :id="store.openId" />
  <SettingDialog v-if="store.showSettingDialog" />
</template>
