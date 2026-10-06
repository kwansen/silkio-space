import { getDb } from "@/infrastructure/db/index.ts";
import { useDocDb, type CreateDocParams, type UpdateDocParams, type Doc, type SortField, type SortedPage } from "@/infrastructure/db/document.ts";
import { useSearchApi, type DocIndexInput } from "@/infrastructure/api/search.ts";

// 每页文档数量
const PAGE_SIZE = 10;

// 文档服务层：组装文档数据库元函数提供业务能力，并同步维护搜索索引
export const useDocSvc = async () => {
  // 元函数：获取数据库实例（getDb 内部已单例缓存）
  const db = await getDb();
  // 元函数：组装文档数据库元函数集合
  const docDb = useDocDb();
  // 元函数：组装搜索索引元函数集合
  const searchApi = useSearchApi();

  // 元函数：将文档组装为索引输入项（使用纯文本作为搜索内容）
  const toIndexInput = (doc: Doc): DocIndexInput => ({
    id: doc.id,
    title: doc.title ?? "",
    content: doc.plain_text ?? "",
  });

  // 元函数：创建文档并同步创建索引
  const create = async (params: CreateDocParams = {}): Promise<string> => {
    const id = await docDb.create(db, params);
    const doc = await docDb.getById(db, id);
    if (doc) await searchApi.createDocIndex(toIndexInput(doc));
    return id;
  };

  // 元函数：批量创建文档并同步批量创建索引
  const createMany = async (list: CreateDocParams[] = []): Promise<string[]> => {
    const ids = await docDb.createMany(db, list);
    const docs = (await Promise.all(ids.map((id) => docDb.getById(db, id)))).filter((d): d is Doc => d !== null);
    await searchApi.createIndexBatch(docs.map(toIndexInput));
    return ids;
  };

  // 元函数：删除文档并同步删除索引
  const remove = async (id: string): Promise<void> => {
    await docDb.remove(db, id);
    await searchApi.deleteIndex(id);
  };

  // 元函数：批量删除文档并同步批量删除索引
  const removeMany = async (ids: string[] = []): Promise<void> => {
    await docDb.removeMany(db, ids);
    await searchApi.deleteIndexBatch(ids);
  };

  // 元函数：更新文档并同步重建索引（先删后建）
  // [日志]
  // 元函数：更新文档，仅当 title/content 变化时同步重建索引
  const update = async (id: string, params: UpdateDocParams): Promise<void> => {
    let t = performance.now();
    await docDb.update(db, id, params);
    let t1 = performance.now();
    console.log(`[perf] touch: db.update ${(t1 - t).toFixed(0)}ms`);
    // 元函数：判断更新是否涉及索引字段（title/content/plain_text）
    const needIndex = "title" in params || "content" in params || "plain_text" in params;
    if (!needIndex) return;
    const doc = await docDb.getById(db, id);
    let t2 = performance.now();
    console.log(`[perf] touch: db.getById ${(t2 - t1).toFixed(0)}ms`);
    if (doc) {
      await searchApi.deleteIndex(id);
      let t3 = performance.now();
      console.log(`[perf] touch: search.deleteIndex ${(t3 - t2).toFixed(0)}ms`);
      await searchApi.createDocIndex(toIndexInput(doc));
      console.log(`[perf] touch: search.createDocIndex ${(performance.now() - t3).toFixed(0)}ms`);
    }
  };

  // 元函数：批量更新文档并同步重建索引
  const updateMany = async (list: { id: string; params: UpdateDocParams }[] = []): Promise<void> => {
    await docDb.updateMany(db, list);
    const docs = (await Promise.all(list.map(({ id }) => docDb.getById(db, id)))).filter((d): d is Doc => d !== null);
    await searchApi.deleteIndexBatch(docs.map((d) => d.id));
    await searchApi.createIndexBatch(docs.map(toIndexInput));
  };

  // 元函数：根据 id 查询文档
  const getById = (id: string): Promise<Doc | null> => docDb.getById(db, id);

  // 元函数：按排序字段与分页参数查询文档分页（页码从 1 开始），并返回总数用于计算页码
  const getSortedInPage = (
    sortField: SortField,
    page: number,
  ): Promise<SortedPage> =>
    docDb.getSorted(db, sortField, 'DESC', PAGE_SIZE, (page - 1) * PAGE_SIZE);

  return { create, createMany, remove, removeMany, update, updateMany, getById, getSortedInPage };
};
