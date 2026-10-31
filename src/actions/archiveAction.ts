import { useFdSvc } from "@/services/folder";
import { useArchiveStore } from "@/stores/archiveStore";
import {
  notifyArchiveChanged,
  notifyEditorOpen,
} from "@/infrastructure/api/windowEvent";
import { storeToRefs } from "pinia";

export const useArchiveAction = () => {
  const svc = useFdSvc();
  const store = useArchiveStore();
  const { archiveSort: sort } = storeToRefs(store);

  // 元函数：按当前排序重新拉取归档列表（供增删改后刷新）
  const refresh = async () => {
    await store.getSortedArchives(sort.value);
  };

  const createArchive = async (v: string) => {
    await svc.createFolder({ name: v });
    notifyArchiveChanged();
    await refresh();
  };

  const updateName = async (id: string, name: string) => {
    await svc.renameFolder({ id, name });
    notifyArchiveChanged();
    await refresh();
  };

  const remove = async (id: string) => {
    await svc.deleteFolder({ id });
    notifyArchiveChanged();
    await refresh();
  };

  //   获取带checked状态的归档
  const checkArchives = async (id: string) => {
    const [archives, folderIds] = await Promise.all([
      svc.getArchives(),
      svc.getFolderIdsByDoc({ docId: id }),
    ]);
    const ids = new Set(folderIds);

    return archives.map((a) => ({
      ...a,
      checked: ids.has(a.id),
    }));
  };

  const addDocToArchives = async (docId: string, archiveIds: string[]) => {
    await svc.addDocToFolders({
      docId: docId,
      folderIds: archiveIds,
    });
    notifyArchiveChanged();
  };

  const openArchive = async (id: string) => {
    await notifyEditorOpen("archive", id);
    await svc.update({ id: id, viewedAt: Date.now() });
    await refresh();
  };

  return {
    refresh,
    createArchive,
    updateName,
    remove,
    checkArchives,
    addDocToArchives,
    openArchive,
  };
};
