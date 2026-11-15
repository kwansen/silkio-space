import { createApp } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createPinia } from "pinia";
import App from "./App.vue";
import i18n from "./i18n";
import { initDb } from "./infrastructure/db/index.ts";
import { ensureIndexConsistency } from "./services/document.ts";
import "@/assets/main.css";

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
// 挂载前初始化数据库，保证组件 setup 阶段 DB 已可用
await initDb();
// 仅主窗口校验搜索索引一致性（多窗口共享同一 Rust 侧索引，避免重复重建）；
// 后台执行不阻塞挂载，失败仅记录（下次启动仍会校验）
if (getCurrentWindow().label === "main") {
  ensureIndexConsistency().catch((e) => console.error("索引一致性校验失败", e));
}
app.mount("#app");
