import { useFdSvc } from "@/services/folder";
import { useArchiveSortStore } from "@/stores/archiveSortStore";
import { useUiStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";

export const useArchiveSortAction = () => {
  const svc = useFdSvc();
  const store = useArchiveSortStore();
  const { setArchives } = store;
  const { archives } = storeToRefs(store);
  const uiStore = useUiStore();
  const { currentArchiveSort: sort } = storeToRefs(uiStore);
  const getSortedArchives = async (v: ArchiveSortOption) => {
    let archives;
    const results = await svc.getArchives();
    if (v === "manual") {
      archives = results;
    } else if (v === "viewedAt") {
      results.sort((a, b) => a.sort_order - b.sort_order);
      archives = results;
    } else {
      results.sort((a, b) => a.name.localeCompare(b.name));
      archives = results;
    }
    setArchives(archives);
  };

  const refresh = async () => {
    await getSortedArchives(sort.value);
  };

  const createArchive = async (v: string) => {
    await svc.createFolder({ name: v });
    await refresh();
    console.log("成功");
  };

  return { getSortedArchives, refresh, createArchive };
};
