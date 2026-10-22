import { useFdSvc } from "@/services/folder";
import { useArchiveStore } from "@/stores/archiveStore";
import { useUiStore } from "@/stores/uiStore";
import { emitTo } from "@tauri-apps/api/event";
import { storeToRefs } from "pinia";

export const useArchiveAction = () => {
  const svc = useFdSvc();
  const store = useArchiveStore();
  const uiStore = useUiStore();
  const { setSortedArchives } = store;
  const { currentArchiveSort: sort } = storeToRefs(uiStore);
  const getSortedArchives = async (v: ArchiveSortOption) => {
    let archives;
    const results = await svc.getArchives();
    if (v === "manual") {
      archives = results;
    } else if (v === "viewedAt") {
      results.sort((a, b) => {
        if (a.viewed_at === null && b.viewed_at === null) return 0;
        if (a.viewed_at === null) return 1;
        if (b.viewed_at === null) return -1;
        return b.viewed_at - a.viewed_at;
      });
      archives = results;
    } else {
      results.sort((a, b) => a.name.localeCompare(b.name));
      archives = results;
    }
    setSortedArchives(archives);
  };

  const refresh = async () => {
    await getSortedArchives(sort.value);
  };

  const createArchive = async (v: string) => {
    await svc.createFolder({ name: v });
    await refresh();
  };

  const updateName = async (id: string, name: string) => {
    await svc.renameFolder({ id, name });
    await refresh();
  };

  const remove = async (id: string) => {
    await svc.deleteFolder({ id });
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
  };

  const openArchive = async (id: string) => {
    await emitTo("editor", "open", { type: "archive", id });
    await svc.update({ id: id, viewedAt: Date.now() });
    await refresh();
  };

  return {
    getSortedArchives,
    refresh,
    createArchive,
    updateName,
    remove,
    checkArchives,
    addDocToArchives,
    openArchive,
  };
};
