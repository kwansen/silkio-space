import { defineStore } from "pinia";
import { ref } from "vue";

// 归档选择弹窗状态：docId 非空表示弹窗打开（弹窗实例由 App.vue 全局挂载，各处通过 open 唤起）
export const useArchivePickerStore = defineStore("archivePicker", () => {
  // 待归档文档 id：null 表示弹窗关闭
  const docId = ref<string | null>(null);

  const open = (id: string) => {
    docId.value = id;
  };

  const close = () => {
    docId.value = null;
  };

  return { docId, open, close };
});
