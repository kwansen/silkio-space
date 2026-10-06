// i18n/index.ts: 国际化配置入口，创建并导出 vue-i18n 实例
import { createI18n } from "vue-i18n";
import zh from "./locales/zh.ts";
import en from "./locales/en.ts";

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem("locale") || "zh",
  fallbackLocale: "en",
  messages: { zh, en },
});

export default i18n;
