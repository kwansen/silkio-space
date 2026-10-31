import { useDebounceFn } from "@vueuse/core";
import { notifyDataChanged } from "@/infrastructure/api/windowEvent";
import { useDocSvc } from "@/services/document";
import { useEditorStore } from "@/stores/editorStore";
import { storeToRefs } from "pinia";

export const useEditorAction = () => {
  const docSvc = useDocSvc();
  const { id, oldContent, oldTitle } = storeToRefs(useEditorStore());

  // 防抖保存：等保存落库完成后再广播变更事实，否则其他窗口会查到旧数据
  const saveContent = useDebounceFn(
    async (content: string, plain_text: string, word_count: number) => {
      if (!id.value || content === oldContent.value) return;
      await docSvc.update(id.value, {
        content,
        plain_text,
        word_count,
      });
      oldContent.value = content;
      notifyDataChanged();
    },
    1000,
  );

  const saveTitle = useDebounceFn(async (v: string) => {
    if (!id.value || v === oldTitle.value) return;
    await docSvc.update(id.value, { title: v });
    oldTitle.value = v;
    notifyDataChanged();
  }, 1000);

  return { saveContent, saveTitle };
};
