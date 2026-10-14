import { emitTo } from "@tauri-apps/api/event";

export const useDocAction = () => {
  const openDoc = async (id: string) => {
    await emitTo("editor", "open", { type: "doc", id: id });
  };

  return { openDoc };
};
