import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import i18n from "./i18n";
import { initDb } from "./infrastructure/db/index.ts";
import "@/assets/main.css";

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
// 挂载前初始化数据库，保证组件 setup 阶段 DB 已可用
await initDb();
app.mount("#app");
