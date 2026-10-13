import { defineStore } from "pinia";
import { ref } from "vue";

// 归档列表浮动操作菜单的全局状态：菜单项内聚于 ArchivePopover 组件，弹层实例由 App.vue 挂载
type Key = number | string | null;

export const useArchivePopoverStore = defineStore("archivePopover", () => {
  // 当前打开条目的 key：空表示菜单关闭
  const openKey = ref<Key>();

  // 触发按钮元素：浮动菜单据此定位
  const targetEl = ref<HTMLElement | null>(null);

  // 元函数：打开/切换菜单（重复触发同一条目时关闭）
  const open = (key: Key, el: HTMLElement | null) => {
    if (key !== null && key === openKey.value) {
      close();
      return;
    }
    targetEl.value = el;
    openKey.value = key;
  };

  // 元函数：关闭菜单
  const close = () => {
    openKey.value = null;
    targetEl.value = null;
  };

  return { openKey, targetEl, open, close };
});
