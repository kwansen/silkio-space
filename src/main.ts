import { createApp } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { createPinia } from "pinia";
import App from "./App.vue";
import i18n from "./i18n";
import { initDb } from "./infrastructure/db/index.ts";
import { ensureIndexConsistency, useDocSvc } from "./services/document.ts";
import { gcOrphanImages } from "./services/imageGc.ts";
import { useFdSvc } from "./services/folder.ts";
import "@/assets/main.css";

const app = createApp(App);

// 任务管理器中 WebView2 子进程显示的是 document.title（而非窗口 title），
// 四个窗口共用同一 index.html，故按窗口 label 在入口处区分命名
const WINDOW_TITLES: Record<string, string> = {
  main: "Silkio Space - 主窗口",
  editor: "Silkio Space - 编辑",
  tool: "Silkio Space - 创建",
  search: "Silkio Space - 搜索",
};
document.title = WINDOW_TITLES[getCurrentWindow().label] ?? "Silkio Space";

app.use(createPinia());
app.use(i18n);
// 挂载前初始化数据库，保证组件 setup 阶段 DB 已可用
await initDb();
// 仅主窗口执行启动维护（多窗口共享同一 Rust 侧索引，避免重复重建）；
// 后台异步执行不阻塞挂载，失败仅记录（下次启动仍会执行）：
// 先清理回收站过期文档（90 天），再做索引一致性校验——清理会改变 db 文档数量，
// 若顺序颠倒会触发一次不必要的索引全量重建
if (getCurrentWindow().label === "main") {
  (async () => {
    try {
      await useDocSvc().purgeExpired();
    } catch (e) {
      console.error("回收站过期清理失败", e);
    }
    try {
      await useFdSvc().purgeExpiredFolders();
    } catch (e) {
      console.error("回收站过期归档清理失败", e);
    }
    try {
      await gcOrphanImages();
    } catch (e) {
      console.error("孤儿图片清理失败", e);
    }
    ensureIndexConsistency().catch((e) =>
      console.error("索引一致性校验失败", e),
    );
  })();
}
app.mount("#app");
