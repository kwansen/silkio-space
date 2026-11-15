// search.ts: 前端搜索 API 封装，提供调用 Tantivy 搜索引擎的接口
import { invoke } from "@tauri-apps/api/core";

// 搜索结果项
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
}

// 文档索引输入项
export interface DocIndexInput {
  id: string;
  title: string;
  content: string;
}

export const useSearchApi = () => {
  // 元函数：invoke 封装底层 tauri 命令
  const call = <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => invoke<T>(cmd, args);

  // 元函数：组装批量文档的元组数组
  const toTuples = (docs: DocIndexInput[]): [string, string, string][] =>
    docs.map((d) => [d.id, d.title, d.content]);

  // 元函数：创建单个文档索引，委托批量创建实现
  const createDocIndex = (doc: DocIndexInput): Promise<void> =>
    call("create_doc_index", { id: doc.id, title: doc.title, content: doc.content });

  // 元函数：批量创建文档索引并一次性提交
  const createIndexBatch = (docs: DocIndexInput[]): Promise<void> =>
    call("create_index_batch", { docs: toTuples(docs) });

  // 元函数：根据 id 删除单个文档索引，委托批量删除实现
  const deleteIndex = (id: string): Promise<void> => call("delete_index", { id });

  // 元函数：根据 id 列表批量删除文档索引
  const deleteIndexBatch = (ids: string[]): Promise<void> => call("delete_index_batch", { ids });

  // 元函数：更新单个文档索引（单次提交内先删后加，委托批量更新实现）
  const updateDocIndex = (doc: DocIndexInput): Promise<void> =>
    call("update_doc_index", { id: doc.id, title: doc.title, content: doc.content });

  // 元函数：批量更新文档索引（同一提交内先删后加，一次 commit 原子生效）
  const updateIndexBatch = (docs: DocIndexInput[]): Promise<void> =>
    call("update_index_batch", { docs: toTuples(docs) });

  // 元函数：查询索引中的文档总数（供启动一致性校验）
  const indexDocCount = (): Promise<number> => call<number>("index_doc_count");

  // 元函数：全量重建索引（清空后按传入文档批量重建，SQLite 为唯一事实源）
  const reindexAll = (docs: DocIndexInput[]): Promise<void> =>
    call("reindex_all", { docs: toTuples(docs) });

  // 元函数：执行全文搜索并返回命中文档列表
  const search = (queryStr: string): Promise<SearchResult[]> => call("search", { queryStr });

  return {
    createDocIndex,
    createIndexBatch,
    updateDocIndex,
    updateIndexBatch,
    deleteIndex,
    deleteIndexBatch,
    indexDocCount,
    reindexAll,
    search,
  };
};
