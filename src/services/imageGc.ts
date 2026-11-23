import { getDb } from "@/infrastructure/db/index.ts";
import { useDocDb } from "@/infrastructure/db/document.ts";
import { exists, readDir, remove, BaseDirectory } from "@tauri-apps/plugin-fs";

// 孤儿图片 GC：图片采用内容 hash 命名（方案 C，不维护引用表/计数），
// 引用关系派生自文档 content 中的图片 URL，GC 时刻全量重算引用集即可永不失真。
// 只在启动时后台跑一次，删除文档不触发；孤儿文件在两次启动之间最多存活一个启动周期

// 图片引用 hash 提取正则（SHA-256 hex 文件名 + 扩展名，不含路径分隔符，
// 兼容正/反斜杠与 URL 编码，64 位 hex 误匹配概率可忽略）
const IMAGE_REF_RE = /[0-9a-f]{64}\.[A-Za-z0-9]{1,8}/g;

// 清理 images/ 目录中不再被任何文档（含软删除）引用的图片文件
export const gcOrphanImages = async (): Promise<void> => {
  const db = getDb();
  const docDb = useDocDb();
  // images/ 目录由 RTImageLocal 首次写入图片时懒创建，全新环境不存在则无需 GC
  if (!(await exists("images", { baseDir: BaseDirectory.AppData }))) return;
  const files = await readDir("images", { baseDir: BaseDirectory.AppData });
  if (files.length === 0) return;
  const docs = await docDb.getAllContents(db);
  const referenced = new Set<string>();
  for (const { content } of docs) {
    if (!content) continue;
    for (const match of content.matchAll(IMAGE_REF_RE)) {
      referenced.add(match[0]);
    }
  }
  for (const file of files) {
    if (referenced.has(file.name)) continue;
    await remove(`images/${file.name}`, { baseDir: BaseDirectory.AppData });
  }
};
