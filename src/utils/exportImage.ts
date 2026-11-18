import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

// 导出图片：dialog 插件弹原生保存对话框选路径（选中路径会被 dialog 插件
// 动态加入 fs scope），再由 fs 插件写盘；用户取消返回 false。
export const exportImage = async (
  fileName: string,
  blob: Blob,
): Promise<boolean> => {
  const path = await save({
    defaultPath: fileName,
    filters: [{ name: "PNG 图片", extensions: ["png"] }],
  });
  if (!path) return false;
  await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
  return true;
};
