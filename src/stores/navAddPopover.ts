import { defineStore } from "pinia";
import { ref } from "vue";

// 「导航区新建」浮动菜单的全局状态：触发按钮唤起/关闭，弹层实例由 App.vue 挂载
export const useNavAddPopoverStore = defineStore("navAddPopover", () => {
  // 菜单是否打开
  const isOpen = ref(false);

  // 触发按钮元素：浮动菜单据此定位
  const targetEl = ref<HTMLElement | null>(null);

  // 元函数：打开/关闭菜单（重复触发同一按钮时关闭）
  const toggle = (el: HTMLElement | null) => {
    if (isOpen.value) {
      close();
      return;
    }
    targetEl.value = el;
    isOpen.value = true;
  };

  // 元函数：关闭菜单
  const close = () => {
    isOpen.value = false;
    targetEl.value = null;
  };

  return { isOpen, targetEl, toggle, close };
});
