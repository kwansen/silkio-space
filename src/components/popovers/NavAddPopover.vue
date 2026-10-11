<script setup lang="ts">
import { autoUpdate, flip, offset, useFloating } from "@floating-ui/vue";
import { computed, ref, useTemplateRef } from "vue";
import { onClickOutside } from "@vueuse/core";
import { storeToRefs } from "pinia";
import Popover, { PopoverItem } from "@/components/shared/Popover.vue";
import Doc from "@/components/icons/Doc.vue";
import Mindmap from "@/components/icons/Mindmap.vue";
import Flowchart from "@/components/icons/Flowchart.vue";
import Folder from "@/components/icons/Folder.vue";
import { useEditorViewStore } from "@/stores/editorView";
import { useNavTreeStore } from "@/stores/navTree";
import { useNavAddPopoverStore } from "@/stores/navAddPopover.ts";
import { useDoc } from "@/composables/useDocuments.ts";
import { useDocSvc } from "@/services/document.ts";
import { useFdSvc } from "@/services/folder.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";

// 全局「导航区新建」浮动菜单：状态由 navAddPopover store 承载，实例由 App.vue 挂载
const store = useNavAddPopoverStore();

const { isOpen, targetEl } = storeToRefs(store);

const floatingRef = useTemplateRef<HTMLElement>("floatingRef");

const { floatingStyles } = useFloating(targetEl, floatingRef, {
  placement: "bottom-end",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

// 忽略触发按钮：点击按钮时交给 toggle 处理开/关，避免先关后开的抖动
onClickOutside(
  floatingRef,
  () => {
    store.close();
  },
  { ignore: [computed(() => targetEl.value)] },
);

const editorViewStore = useEditorViewStore();
const navTreeStore = useNavTreeStore();

// 元函数：组装文档组合式函数（创建富文本/思维导图/流程图）
const { createRichText, createMindMap, createFlowChart } = useDoc();

// 元函数：当前新建目标容器：选中了导航文件夹时为其，否则为归档根目录
const createTargetId = () =>
  navTreeStore.selectedFolderId ?? editorViewStore.folder?.id ?? null;

// 元函数：创建指定类型文档、加入当前新建目标容器并在当前窗口打开，同时通知 main 刷新列表
const createDoc = async (create: () => Promise<string>) => {
  try {
    const folderSvc = useFdSvc();
    const docSvc = await useDocSvc();
    const id = await create();
    const containerId = createTargetId();
    if (containerId)
      await folderSvc.addDocToFolder({ folderId: containerId, docId: id });
    const doc = await docSvc.getById(id);
    editorViewStore.setDoc(doc);
    editorViewStore.setKey(Date.now());
    store.close();
    await notifyMainRefresh();
  } catch (e) {
    console.error(e);
  }
};

// 元函数：新建文件夹：选中了导航文件夹时建在其内（并展开），否则建在归档根目录；
// 完成后选中新文件夹并刷新导航树
const handleCreateFolder = async () => {
  try {
    const containerId = createTargetId();
    if (!containerId) return;
    const folderSvc = useFdSvc();
    const id = await folderSvc.createFolder({
      name: "新建文件夹",
      parentId: containerId,
    });
    navTreeStore.setSelectedFolder(id);
    navTreeStore.expand(containerId);
    navTreeStore.expand(id);
    navTreeStore.bump();
    store.close();
  } catch (e) {
    console.error(e);
  }
};

const list = ref<PopoverItem[]>([
  { name: "富文本", action: () => createDoc(createRichText) },
  { name: "思维导图", action: () => createDoc(createMindMap) },
  { name: "流程图", action: () => createDoc(createFlowChart) },
  { name: "文件夹", action: handleCreateFolder },
]);
</script>

<template>
  <Popover v-if="isOpen" ref="floatingRef" :style="floatingStyles">
    <div
      v-for="item in list"
      :key="item.name"
      class="w-full py-2 hover:bg-gray-100 flex items-center gap-2 px-4 text-xs"
      @click="item.action()"
    >
      <Doc v-if="item.name === '富文本'" class="w-5 h-5 text-neutral-500" />
      <Mindmap
        v-else-if="item.name === '思维导图'"
        class="w-5 h-5 text-neutral-500"
      />
      <Flowchart
        v-else-if="item.name === '流程图'"
        class="w-5 h-5 text-neutral-500"
      />
      <Folder v-else class="w-5 h-5 text-neutral-500" />
      <div>{{ item.name }}</div>
    </div>
  </Popover>
</template>
