<script setup lang="ts">
import { offset, useFloating, flip, autoUpdate } from "@floating-ui/vue";
import { storeToRefs } from "pinia";
import { watch, computed, ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import Popover, { PopoverItem } from "@/components/shared/Popover.vue";
import { useDocPopoverStore } from "@/stores/docPopover.ts";

// 文档列表的浮动操作菜单：状态由 docPopover store 承载，实例由 App.vue 全局挂载
const store = useDocPopoverStore();

const { openKey, targetEl } = storeToRefs(store);

const floatingRef = ref<HTMLElement | null>(null);

// 元函数：为菜单动作注入当前打开条目的 key，执行后关闭菜单
const boundPopoverList = computed<PopoverItem[]>(() =>
  store.list.map((p) => ({
    ...p,
    action: () => {
      p.action(openKey.value);
      store.close();
    },
  })),
);

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
