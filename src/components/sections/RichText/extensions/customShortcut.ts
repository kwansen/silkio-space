import { useEditorStore } from "@/stores/editorStore";
import { Extension } from "@tiptap/core";

export const CustomShortcut = Extension.create({
  name: "customShortcut",

  addKeyboardShortcuts() {
    return {
      // 清除文本标记
      "Mod-\\": () => {
        this.editor.chain().focus().unsetAllMarks().run();
        return true;
      },
      // 打开link对话框
      "Mod-k": () => {
        useEditorStore().setRichtextDialog("link");
        return true;
      },
      // 打开math对话框
      "Mod-Shift-m": () => {
        useEditorStore().setRichtextDialog("math");
        return true;
      },
      // 打开图片对话框
      "Mod-Alt-i": () => {
        useEditorStore().setRichtextDialog("image");
        return true;
      },
      // 插入分割线
      "Mod-Shift--": () => {
        this.editor.chain().focus().setHorizontalRule().run();
        return true;
      },

      // 插入表格
      "Mod-Shift-t": () => {
        this.editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
        return true;
      },
    };
  },
});
