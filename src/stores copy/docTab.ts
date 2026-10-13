import { DocTabIconKey } from "@/icons";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useDocTabStore = defineStore('docTab', () => {
  const tab = ref<DocTabIconKey>("docSort");

  const setTab = (v: DocTabIconKey) => {
    tab.value = v;
  };

  return { tab, setTab }
})