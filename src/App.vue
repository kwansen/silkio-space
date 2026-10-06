<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";
import MainView from "./views/MainView.vue";
import EditorView from "./views/EditorView.vue";
import SearchView from "./views/SearchView.vue";
import InsertView from "./views/InsertView.vue";
import ToolView from "./views/ToolView.vue";
import WindowControl from "./components/sections/WindowControl/WindowControl.vue";
import { useEditorViewStore } from "./stores/editorView.ts";
const store = useEditorViewStore();
const { setDoc } = store;
const label = getCurrentWindow().label;
const handleReset = () => {
  setDoc(null);
};
</script>

<template>
  <div class="w-screen h-screen flex flex-col overflow-hidden">
    <WindowControl v-if="label === 'main' || 'editor'" @on-hide="handleReset" />
    <div class="flex-1 flex overflow-hidden">
      <MainView v-if="label === 'main'" />
      <EditorView v-else-if="label === 'editor'" />
      <SearchView v-else-if="label === 'search'" />
      <InsertView v-else-if="label === 'insert'" />
      <ToolView v-else-if="label === 'tool'" />
    </div>
  </div>
</template>
