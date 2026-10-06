// search.ts: 前端搜索 API 封装，提供调用 Tantivy 搜索引擎的接口
import { invoke } from "@tauri-apps/api/core";

// 搜索结果接口
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
}

// 文档输入接口
export interface DocumentInput {
  id: string;
  title: string;
  content: string;
}

// 初始化搜索索引
export async function initSearchIndex(indexPath: string): Promise<void> {
  await invoke("init_search_index", { indexPath });
}

// 添加单个文档
export async function addDocument(doc: DocumentInput): Promise<void> {
  await invoke("add_document", { doc });
}

// 批量添加文档
export async function addDocuments(docs: DocumentInput[]): Promise<void> {
  await invoke("add_documents", { docs });
}

// 执行全文搜索
export async function search(query: string, limit?: number): Promise<SearchResult[]> {
  return await invoke("search", { queryStr: query, limit });
}

// 删除文档
export async function deleteDocument(id: string): Promise<void> {
  await invoke("delete_document", { id });
}
