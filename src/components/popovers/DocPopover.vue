<script setup lang="ts">
import { offset, useFloating, flip, autoUpdate } from "@floating-ui/vue";
import { storeToRefs } from "pinia";
import { watch, ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import Popover, { PopoverItem } from "@/components/shared/Popover.vue";
import { useDocPopoverStore } from "@/stores/docPopover.ts";
import { useDocTabStore } from "@/stores/docTab";
import { useArchivePickerStore } from "@/stores/archivePicker.ts";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import { useDocSearch } from "@/composables/useDocSearch.ts";

// 文档列表的浮动操作菜单：菜单项内聚于本组件，状态由 docPopover store 承载，实例由 App.vue 全局挂载
const store = useDocPopoverStore();

const { openKey, targetEl } = storeToRefs(store);

const floatingRef = ref<HTMLElement | null>(null);

const docTabStore = useDocTabStore();
const archivePickerStore = useArchivePickerStore();
// 元函数：组装排序与搜索文档组合式函数（删除后各自刷新所在视图的列表）
const { removeDoc: removeSortDoc } = useSortDocs();
const { removeDoc: removeSearchDoc } = useDocSearch();

// popover 菜单：归档（唤起全局归档选择弹窗）与删除（按当前页签分派删除逻辑，key 为当前文档 id）
const popoverList: PopoverItem[] = [
  {
    icon: "mdi:archive-outline",
    name: "归档",
    action: (key) => {
      if (key === null || key === undefined) return;
      archivePickerStore.open(String(key));
    },
  },
  {
    icon: "mdi:delete-outline",
    name: "删除",
    action: async (key) => {
      if (key === null || key === undefined) return;
      const id = String(key);
      if (docTabStore.tab === "docSearch") await removeSearchDoc(id);
      else await removeSortDoc(id);
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
