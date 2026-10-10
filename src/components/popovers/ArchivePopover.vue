<script setup lang="ts">
import { offset, useFloating, flip, autoUpdate } from "@floating-ui/vue";
import { storeToRefs } from "pinia";
import { watch, ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import Popover, { PopoverItem } from "@/components/shared/Popover.vue";
import { useArchivePopoverStore } from "@/stores/archivePopover.ts";
import { useDocTabStore } from "@/stores/docTab";
import { useArchiveSortStore } from "@/stores/archiveSort";
import { useArchiveSearchStore } from "@/stores/archiveSearch";
import { useArchiveRenameStore } from "@/stores/archiveRename.ts";
import { useArchiveSort } from "@/composables/useArchiveSort.ts";
import { useArchiveSearch } from "@/composables/useArchiveSearch.ts";

// 归档列表的浮动操作菜单：菜单项内聚于本组件，状态由 archivePopover store 承载，实例由 App.vue 全局挂载
const store = useArchivePopoverStore();

const { openKey, targetEl } = storeToRefs(store);

const floatingRef = ref<HTMLElement | null>(null);

const docTabStore = useDocTabStore();
const archiveSortStore = useArchiveSortStore();
const archiveSearchStore = useArchiveSearchStore();
const archiveRenameStore = useArchiveRenameStore();
// 元函数：组装归档排序与搜索组合式函数（删除后各自刷新所在视图的列表）
const { removeFolder: removeSortFolder } = useArchiveSort();
const { removeFolder: removeSearchFolder } = useArchiveSearch();

// popover 菜单：编辑（唤起全局重命名弹窗）与删除（按当前页签分派删除逻辑，key 为当前归档 id）
const popoverList: PopoverItem[] = [
  {
    icon: "mdi:pencil-outline",
    name: "编辑",
    action: (key) => {
      if (key === null || key === undefined) return;
      const id = String(key);
      // 排序与搜索视图互斥激活，两处来源必有其一持有该归档
      const folder =
        archiveSortStore.folders.find((f) => f.id === id) ??
        archiveSearchStore.archives.find((f) => f.id === id);
      if (folder) archiveRenameStore.open(folder);
    },
  },
  {
    icon: "mdi:delete-outline",
    name: "删除",
    action: async (key) => {
      if (key === null || key === undefined) return;
      const id = String(key);
      if (docTabStore.tab === "archiveSearch") await removeSearchFolder(id);
      else await removeSortFolder(id);
    },
  },
];

// 元函数：为菜单动作注入当前打开条目的 key，执行后关闭菜单
const boundPopoverList: PopoverItem[] = popoverList.map((p) => ({
  ...p,
  action: () => {
    p.action(openKey.value);
    store.close();
  },
}));

const { floatingStyles, update } = useFloating(targetEl, floatingRef, {
  placement: "bottom-start",
  middleware: [flip(), offset(8)],
  whileElementsMounted: autoUpdate,
});

watch(
  () => targetEl.value,
  () => update(),
);

onClickOutside(
  floatingRef,
  () => {
    store.close();
  },
  {
    ignore: [".ignore"],
  },
);
</script>

<template>
  <Popover
    v-if="openKey"
    :list="boundPopoverList"
    ref="floatingRef"
    :style="floatingStyles"
  />
</template>
