import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { Shortcut } from "@/types/setting";

export const useSettingStore = defineStore("setting", () => {
  const openSearchWindow = useLocalStorage<Shortcut>("openSearchWindow", {
    ctrl: false,
    shift: false,
    alt: true,
    meta: false,
    key: "K",
    code: "KeyK",
  });
  const openToolWindow = useLocalStorage<Shortcut>("openToolWindow", {
    ctrl: false,
    shift: false,
    alt: true,
    meta: false,
    key: "N",
    code: "KeyN",
  });

  return { openSearchWindow, openToolWindow };
});
