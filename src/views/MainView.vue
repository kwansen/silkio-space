<script setup lang="ts">
import { useArchiveAction } from "@/actions/archiveAction";
import { useDocAction } from "@/actions/docAction";
import ArchiveSearch from "@/components/sections/ArchiveSearch/ArchiveSearch.vue";
import ArchiveSort from "@/components/sections/ArchiveSort/ArchiveSort.vue";
import DocSearch from "@/components/sections/DocSearch/DocSearch.vue";
import DocSort from "@/components/sections/DocSort/DocSort.vue";
import DocTabs from "@/components/sections/DocTabs/DocTabs.vue";
import Trash from "@/components/sections/Trash/Trash.vue";
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

let stopOnDocChanged: (() => void) | null = null;
let stopOnArchiveChanged: (() => void) | null = null;

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

  // 数据事实按域订阅：文档域变化刷新文档列表，归档域变化刷新归档列表
  stopOnDocChanged = await listen("doc:changed", () => docAction.refreshAll());
  stopOnArchiveChanged = await listen("archive:changed", () =>
    archiveAction.refresh(),
  );
});

onUnmounted(() => {
  stopOnDocChanged?.();
  stopOnArchiveChanged?.();
});
</script>

<template>
  <div class="w-full h-full flex">
    <div class="w-10 h-full">
      <DocTabs />
    </div>
    <div class="flex-1 p-2">
      <ScrollArea class="bg-gray-50 rounded-lg">
        <div class="py-14 w-full max-w-176 mx-auto">
          <div class="bg-white rounded-2xl overflow-hidden">
            <DocSort v-if="tab === 'docSort'" />
            <DocSearch v-if="tab === 'docSearch'" />
            <ArchiveSort v-if="tab === 'archiveSort'" />
            <ArchiveSearch v-if="tab === 'archiveSearch'" />
            <Trash v-if="tab === 'trash'" />
          </div>
        </div>
      </ScrollArea>
    </div>
  </div>
  <ArchivePickerDialog v-if="store.openId" :id="store.openId" />
</template>
