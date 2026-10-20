import { useFdSvc } from "@/services/folder";
import { useArchiveSortStore } from "@/stores/archiveSortStore";
import { useUiStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";

export const useArchiveSortAction = () => {
  const svc = useFdSvc();
  const store = useArchiveSortStore();
  const { setSortedArchives } = store;
  const uiStore = useUiStore();
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
        return a.viewed_at - b.viewed_at;
      });
      archives = results;
    } else {
      results.sort((a, b) => a.name.localeCompare(b.name));
      archives = results;
    }
    setSortedArchives(archives);
  };

  const refreshSortedArchives = async () => {
    await getSortedArchives(sort.value);
  };

  const createArchive = async (v: string) => {
    await svc.createFolder({ name: v });
    await refreshSortedArchives();
  };

  const updateName = async (id: string, name: string) => {
    await svc.renameFolder({ id, name });
    await refreshSortedArchives();
  };

  const remove = async (id: string) => {
    await svc.deleteFolder({ id });
    await refreshSortedArchives();
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

  return {
    getSortedArchives,
    refreshSortedArchives,
    createArchive,
    updateName,
    remove,
    checkArchives,
    addDocToArchives,
  };
};
