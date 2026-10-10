//#region CHECKED：在mainview里创建文档
/***
 * 创建文档
 * 通知editorview显示
 * 刷新mainview的数据：排序的文档和搜索的文档
 ***/
import { useDoc } from "@/composables/useDocuments.ts";
import { useSortDocs } from "@/composables/useSortDocs.ts";
import { useDocSearch } from "@/composables/useDocSearch.ts";
import { useDocSearchStore } from "@/stores/docSearch";
import { notifyEditorOpen } from "@/infrastructure/api/windowEvent.ts";

export const createDocInMainView = async (
  type: "richtext" | "mindmap" | "flowchart",
) => {
  // 元函数：组装文档创建、排序文档与搜索文档组合式函数
  const { createRichText, createMindMap, createFlowChart } = useDoc();
  const { refreshDocs } = useSortDocs();
  const { searchDocs } = useDocSearch();
  const docSearchStore = useDocSearchStore();

  try {
    // 文档类型 → 创建函数
    const createMap = {
      richtext: createRichText,
      mindmap: createMindMap,
      flowchart: createFlowChart,
    } as const;

    // 创建文档
    const id = await createMap[type]();

    // 通知editorview显示
    await notifyEditorOpen("doc", id);

    // 刷新mainview的数据：排序的文档和搜索的文档（搜索沿用当前关键词）
    await refreshDocs();
    await searchDocs(docSearchStore.query);

    return id;
  } catch (e) {
    console.error(e);
  }
};
//#endregion

//#region CHECKED：在mainview里删除文档
/***
 * 删除文档
 * 删除文档和folder的关系
 * 刷新mainview的数据：排序的文档和搜索的文档
 * 通知editorview，如果nav有该文档，需要删除。如果显示的是当前文档，需要显示empty
 ***/
import { useFdSvc } from "@/services/folder.ts";
import { notifyEditorDocRemoved } from "@/infrastructure/api/windowEvent.ts";

export const removeDocInMainView = async (id: string) => {
  // 元函数：组装排序文档、搜索文档组合式函数与归档服务
  const { removeDoc } = useSortDocs();
  const { searchDocs } = useDocSearch();
  const docSearchStore = useDocSearchStore();
  const fdSvc = useFdSvc();

  try {
    // 删除文档（含搜索索引）并刷新排序的文档（当前页删空时回退到上一页）
    await removeDoc(id);

    // 删除文档和folder的关系
    await fdSvc.removeDocRelations({ docId: id });

    // 刷新mainview的数据：搜索的文档（沿用当前关键词）
    await searchDocs(docSearchStore.query);

    // 通知editorview：nav 重载移除该文档；当前展示该文档时显示 empty
    await notifyEditorDocRemoved(id);
  } catch (e) {
    console.error(e);
  }
};
//#endregion

//#region CHECKED：在mainview里将文档归档
/***
 * 将文档归档
 * 通知editorview，如果放进的是该归档，则将文档放入nav
 * @param params.docId      必须，文档 id
 * @param params.archiveIds 必须，要放入的归档 id 集合
 ***/
import { notifyEditorFolderChange } from "@/infrastructure/api/windowEvent.ts";

export const archiveDocInMainView = async (params: {
  docId: string;
  archiveIds: string[];
}) => {
  // 元函数：组装归档服务
  const fdSvc = useFdSvc();

  try {
    // 将文档归档：批量写入关联
    await fdSvc.addDocToFolders({
      folderIds: params.archiveIds,
      docId: params.docId,
    });

    // 通知editorview：放进的正被展示时，nav 重载后文档进入 nav
    await Promise.all(
      params.archiveIds.map((folderId) => notifyEditorFolderChange(folderId)),
    );
  } catch (e) {
    console.error(e);
  }
};
//#endregion

//#region CHECKED：在mainview里创建归档
/***
 * 创建归档
 * 通知editorview打开归档
 * 刷新数据，归档列表
 * @param params.name 必须，归档名称
 ***/
import { useArchiveSortStore } from "@/stores/archiveSort";

export const createArchiveInMainView = async (params: { name: string }) => {
  // 元函数：组装归档服务与归档列表 store
  const fdSvc = useFdSvc();
  const archiveSortStore = useArchiveSortStore();

  try {
    // 创建归档
    const id = await fdSvc.createFolder({ name: params.name });

    // 通知editorview打开归档
    await notifyEditorOpen("folder", id);

    // 刷新数据，归档列表（沿用当前排序方式）
    const list = await fdSvc.getSortedFolders({
      sortField: archiveSortStore.sortField,
    });
    archiveSortStore.setFolders(list);

    return id;
  } catch (e) {
    console.error(e);
  }
};
//#endregion

//#region CHECKED：在mainview里删除归档
/***
 * @step1 删除归档
 * @step2 通知editorview，如果显示是该归档，隐藏editorview（如果不隐藏，似乎没有意义，因为页面什么也没有）
 * @step3 刷新数据：归档列表
 * @param params.id 必须，归档 id
 ***/
export const removeArchiveInMainView = async (params: { id: string }) => {
  // 元函数：组装归档服务与归档列表 store
  const fdSvc = useFdSvc();
  const archiveSortStore = useArchiveSortStore();

  try {
    // 删除归档（级联删除后代文件夹与关联行，文档本体保留）
    await fdSvc.deleteFolder({ id: params.id });

    // 通知editorview：显示的是该归档时隐藏 editor 窗口
    await notifyEditorFolderChange(params.id);

    // 刷新数据，归档列表（沿用当前排序方式）
    const list = await fdSvc.getSortedFolders({
      sortField: archiveSortStore.sortField,
    });
    archiveSortStore.setFolders(list);
  } catch (e) {
    console.error(e);
  }
};
//#endregion

//#region CHECKED：在mainview里重命名归档
/***
 * @step1 重命名归档
 * @step2 刷新归档列表
 * @step3 通知editorview，如果打开的是该归档，就将nav的归档名称修改
 * @param params.id   必须，归档 id
 * @param params.name 必须，新名称
 ***/
export const renameArchiveInMainView = async (params: {
  id: string;
  name: string;
}) => {
  // 元函数：组装归档服务与归档列表 store
  const fdSvc = useFdSvc();
  const archiveSortStore = useArchiveSortStore();

  try {
    // 重命名归档（同时刷新 updated_at）
    await fdSvc.renameFolder({ id: params.id, name: params.name });

    // 刷新归档列表（沿用当前排序方式）
    const list = await fdSvc.getSortedFolders({
      sortField: archiveSortStore.sortField,
    });
    archiveSortStore.setFolders(list);

    // 通知editorview：打开的是该归档时，nav 重载后归档名称同步修改
    await notifyEditorFolderChange(params.id);
  } catch (e) {
    console.error(e);
  }
};
//#endregion

//#region CHECKED：在editorview里创建文档
/***
 * @step1 创建文档
 * @step2 刷新nav和文档内容
 * @step3 刷新mainview的sortdoc和searchdoc
 * @param type 文档类型
 ***/
import { useEditorViewStore } from "@/stores/editorView";
import { useNavTreeStore } from "@/stores/navTree";
import { useDocSvc } from "@/services/document.ts";
import { notifyMainRefresh } from "@/infrastructure/api/windowEvent.ts";

export const createDocInEditorView = async (
  type: "richtext" | "mindmap" | "flowchart",
) => {
  // 元函数：组装文档创建、editorview 状态、导航树与文档/归档服务
  const { createRichText, createMindMap, createFlowChart } = useDoc();
  const editorStore = useEditorViewStore();
  const navTreeStore = useNavTreeStore();
  const fdSvc = useFdSvc();
  const docSvc = await useDocSvc();

  try {
    // 文档类型 → 创建函数
    const createMap = {
      richtext: createRichText,
      mindmap: createMindMap,
      flowchart: createFlowChart,
    } as const;

    // 创建文档，加入当前新建目标容器（选中了导航文件夹时为其，否则为归档根目录）
    const id = await createMap[type]();
    const containerId =
      navTreeStore.selectedFolderId ?? editorStore.folder?.id ?? null;
    if (containerId) {
      await fdSvc.addDocToFolder({ folderId: containerId, docId: id });
    }

    // 刷新nav和文档内容：展示新文档并重载导航树
    const doc = await docSvc.getById(id);
    editorStore.setDoc(doc);
    editorStore.setKey(Date.now());
    navTreeStore.bump();

    // 刷新mainview的sortdoc和searchdoc（跨窗口，经 refresh 事件通知）
    await notifyMainRefresh();

    return id;
  } catch (e) {
    console.error(e);
  }
};
//#endregion

//#region CHECKED：在editorview里修改文档标题
/***
 * @step1 修改文档标题
 * @step2 如果打开的是archive，需要更新nav的标题和toc的标题；如果打开的是document，只需要更改toc标题
 * @step3 通知mainview刷新数据：sortdoc和searchdoc
 * @param params.id    必须，文档 id
 * @param params.title 必须，新标题
 ***/
export const updateDocTitleInEditorView = async (params: {
  id: string;
  title: string;
}) => {
  // 元函数：组装文档更新与 editorview/导航树状态
  const { updateTitle } = useDoc();
  const editorStore = useEditorViewStore();
  const navTreeStore = useNavTreeStore();

  try {
    // 修改文档标题（服务层同步重建搜索索引）
    await updateTitle(params.id, params.title);

    // toc的标题：就地更新当前展示文档（不触发编辑器重挂载）；
    // 打开的是archive时额外重载nav以更新树内该文档标题
    if (editorStore.doc?.id === params.id) {
      editorStore.doc.title = params.title;
      if (editorStore.folder) navTreeStore.bump();
    }

    // 通知mainview刷新数据：sortdoc和searchdoc（跨窗口，经 refresh 事件通知）
    await notifyMainRefresh();
  } catch (e) {
    console.error(e);
  }
};
//#endregion

//#region CHECKED：在editorview里删除文档
/***
 * @step1 删除文档（实际上是删除folder_document,文档本身不删除）
 * @step2 刷新nav和doc
 * @param params.docId 必须，文档 id
 ***/
export const removeDocInEditorView = async (params: { docId: string }) => {
  // 元函数：组装 editorview/导航树状态与归档服务
  const editorStore = useEditorViewStore();
  const navTreeStore = useNavTreeStore();
  const fdSvc = useFdSvc();

  try {
    if (!editorStore.folder) return;
    const folderId = editorStore.folder.id;

    // 删除文档：仅从当前归档子树移除（删除 folder_document 关联行，文档本体保留）
    await fdSvc.removeDocFromSubtree({ folderId, docId: params.docId });

    // 刷新nav和doc：nav 重载；当前展示的是该文档时切换为归档子树内第一篇文档
    if (editorStore.doc?.id === params.docId) {
      editorStore.setDoc(await fdSvc.getFirstDocInSubtree({ folderId }));
      editorStore.setKey(Date.now());
    }
    navTreeStore.bump();
  } catch (e) {
    console.error(e);
  }
};
//#endregion
