<script setup lang="ts">
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { Icon } from "@iconify/vue";
import { onClickOutside } from "@vueuse/core";
import { ref, useTemplateRef } from "vue";
import Popover, { PopoverItem } from "@/components/shared/Popover.vue";
import { docTypeIcons } from "@/icons";
import { useEditorViewStore } from "@/stores/editorView";
import { useDoc } from "@/composables/useDocuments.ts";
import { useDocSvc } from "@/services/document.ts";
import { useFolderSvc } from "@/services/folder.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";

const store = useEditorViewStore();
// 元函数：组装文档组合式函数（创建富文本/思维导图/流程图）
const { createRichText, createMindMap, createFlowChart } = useDoc();

const isOpen = ref<boolean>(false);

// 元函数：创建指定类型文档、加入当前归档并在当前窗口打开，同时通知 main 刷新列表
const createDoc = async (create: () => Promise<string>) => {
  try {
    const folderSvc = await useFolderSvc();
    const docSvc = await useDocSvc();
    const id = await create();
    if (store.folder) await folderSvc.addDoc(store.folder.id, id);
    const doc = await docSvc.getById(id);
    store.setDoc(doc);
    store.setKey(Date.now());
    isOpen.value = false;
    await notifyMainRefresh();
  } catch (e) {
    console.error(e);
  }
};

// 元函数：创建归档（默认挂在根目录，默认名"新建归档"）并通知 main 刷新列表
const handleCreateFolder = async () => {
  try {
    const folderSvc = await useFolderSvc();
    await folderSvc.create();
    isOpen.value = false;
    await notifyMainRefresh();
  } catch (e) {
    console.error(e);
  }
};

const list = ref<PopoverItem[]>([
  {
    icon: docTypeIcons.richText,
    name: "富文本",
    action: () => createDoc(createRichText),
  },
  {
    icon: docTypeIcons.mindMap,
    name: "思维导图",
    action: () => createDoc(createMindMap),
  },
  {
    icon: docTypeIcons.flowChart,
    name: "流程图",
    action: () => createDoc(createFlowChart),
  },
  { icon: docTypeIcons.folder, name: "文件夹", action: handleCreateFolder },
]);

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

const targetRef = useTemplateRef<HTMLElement>("targetRef");

const floatingRef = useTemplateRef<HTMLElement>("floatingRef");

const { floatingStyles } = useFloating(targetRef, floatingRef, {
  placement: "bottom-end",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

onClickOutside(
  floatingRef,
  () => {
    isOpen.value = false;
  },
  { ignore: [targetRef] },
);
</script>
<template>
  <div class="h-full flex items-center">
    <Icon icon="mdi:archive" class="w-4 h-4 mx-2 text-neutral-400" />
    <div class="truncate text-xs text-neutral-400">
      {{ store.folder?.name }}
    </div>
    <div class="flex-1"></div>
    <div
      ref="targetRef"
      class="w-7 h-7 rounded-md grid place-items-center mr-2"
      :class="isOpen ? 'bg-gray-50' : 'hover:bg-gray-50'"
      @click="toggleOpen"
    >
      <Icon icon="mdi:add" class="w-5 h-5" />
      <Popover
        v-if="isOpen"
        :list="list"
        ref="floatingRef"
        :style="floatingStyles"
      />
    </div>
  </div>
</template>
