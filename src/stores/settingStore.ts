import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { Shortcut } from "@/types/setting";

export const useSettingStore = defineStore("setting", () => {
  const openSearchWindow = useLocalStorage<Shortcut>("openSearchWindow", {
    name: "Alt + -",
    code: "Alt + Minus",
  });
  const openToolWindow = useLocalStorage<Shortcut>("openToolWindow", {
    name: "Alt + ,",
    code: "Alt + Comma",
  });

  return { openSearchWindow, openToolWindow };
});
