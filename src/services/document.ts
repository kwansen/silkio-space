import { getDb } from "@/infrastructure/db/index.ts";
import {
  useDocDb,
  type CreateDocParams,
  type UpdateDocParams,
  type SortedPage,
  type SortField,
} from "@/infrastructure/db/document.ts";
import {
  useSearchApi,
  type DocIndexInput,
} from "@/infrastructure/api/search.ts";
import { Doc, ScoredDoc } from "@/types/doc";

// 每页文档数量（列表分页与页码计算共用，唯一定义处）
export const PAGE_SIZE = 10;

// 元函数：将文档组装为索引输入项（使用纯文本作为搜索内容）
const toIndexInput = (doc: Doc): DocIndexInput => ({
  id: doc.id,
  title: doc.title ?? "",
  content: doc.plain_text ?? "",
});

// 文档服务层：组装文档数据库元函数提供业务能力，并同步维护搜索索引
export const useDocSvc = () => {
  // 元函数：获取数据库实例（getDb 内部已单例缓存）
  const db = getDb();
  // 元函数：组装文档数据库元函数集合
  const docDb = useDocDb();
  // 元函数：组装搜索索引元函数集合
  const searchApi = useSearchApi();

  // 元函数：创建文档并同步创建索引
  const create = async (params: CreateDocParams = {}): Promise<string> => {
    const id = await docDb.create(db, params);
    const doc = await docDb.getById(db, id);
    if (doc) await searchApi.createDocIndex(toIndexInput(doc));
    return id;
  };

  // 元函数：批量创建文档并同步批量创建索引
  const createMany = async (
    list: CreateDocParams[] = [],
  ): Promise<string[]> => {
    const ids = await docDb.createMany(db, list);
    const docs = (
      await Promise.all(ids.map((id) => docDb.getById(db, id)))
    ).filter((d): d is Doc => d !== null);
    await searchApi.createIndexBatch(docs.map(toIndexInput));
    return ids;
  };

  // 元函数：软删除文档（标记 deleted_at）并同步移除索引（保持 db 非删除数与索引数一致）
  const remove = async (id: string): Promise<void> => {
    await docDb.remove(db, id);
    await searchApi.deleteIndex(id);
  };

  // 元函数：批量软删除文档并同步批量移除索引
  const removeMany = async (ids: string[] = []): Promise<void> => {
    await docDb.removeMany(db, ids);
    await searchApi.deleteIndexBatch(ids);
  };

  // 元函数：恢复软删除文档（清除标记）并重建索引
  const restore = async (id: string): Promise<void> => {
    await docDb.restore(db, id);
    const doc = await docDb.getById(db, id);
    if (doc) await searchApi.createDocIndex(toIndexInput(doc));
  };

  // 元函数：物理删除文档（永久清除本体与归档关联，v1 trigger 级联）并移除索引，供回收站 GC/清空
  const purge = async (id: string): Promise<void> => {
    await docDb.purge(db, id);
    await searchApi.deleteIndex(id);
  };

  // 元函数：自动清理软删除超过保留期的过期文档（回收站 90 天自动清除）。
  // 注意：未来接入同步后，墓碑 GC 需升级为「所有设备确认收到删除」后才清除，
  // 不能仅按时间强删，否则离线过久的设备将永远收不到该删除
  const purgeExpired = async (retentionDays = 90): Promise<void> => {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const ids = await docDb.getExpiredIds(db, cutoff);
    if (ids.length === 0) return;
    await docDb.purgeMany(db, ids);
    await searchApi.deleteIndexBatch(ids);
  };

  // 元函数：更新文档，仅当 title/content 变化时同步重建索引（单次提交内先删后加，原子生效）
  const update = async (id: string, params: UpdateDocParams): Promise<void> => {
    await docDb.update(db, id, params);
    // 元函数：判断更新是否涉及索引字段（title/content/plain_text）
    const needIndex =
      "title" in params || "content" in params || "plain_text" in params;
    if (!needIndex) return;
    const doc = await docDb.getById(db, id);
    if (doc) await searchApi.updateDocIndex(toIndexInput(doc));
  };

  // 元函数：批量更新文档并同步重建索引（同一提交内先删后加，一次 commit 原子生效）
  const updateMany = async (
    list: { id: string; params: UpdateDocParams }[] = [],
  ): Promise<void> => {
    await docDb.updateMany(db, list);
    const docs = (
      await Promise.all(list.map(({ id }) => docDb.getById(db, id)))
    ).filter((d): d is Doc => d !== null);
    await searchApi.updateIndexBatch(docs.map(toIndexInput));
  };

  // 元函数：根据 id 查询文档
  const getById = (id: string): Promise<Doc | null> => docDb.getById(db, id);

  // 元函数：根据关键词全文搜索文档，回查数据库补全文档信息并附带相关性得分
  const search = async (query: string): Promise<ScoredDoc[]> => {
    const results = await searchApi.search(query);
    const hits = await Promise.all(
      results.map(async ({ id, score }) => {
        const doc = await docDb.getById(db, id);
        return doc ? { ...doc, score } : null;
      }),
    );
    return hits.filter((d): d is ScoredDoc => d !== null);
  };

  // 元函数：按排序字段与分页参数查询文档分页（页码从 1 开始），并返回总数用于计算页码
  const getSortedInPage = (
    sortField: SortField,
    page: number,
  ): Promise<SortedPage> =>
    docDb.getSorted(db, sortField, "DESC", PAGE_SIZE, (page - 1) * PAGE_SIZE);

  return {
    create,
    createMany,
    remove,
    removeMany,
    restore,
    purge,
    purgeExpired,
    update,
    updateMany,
    getById,
    getSortedInPage,
    search,
  };
};

// 元函数：启动时校验搜索索引与 SQLite 的一致性（数量不等则全量重建），
// 兜底崩溃/强杀导致的 SQLite 与 tantivy 索引不同步（双存储无事务保障，只能事后修复）
export const ensureIndexConsistency = async (): Promise<void> => {
  const db = getDb();
  const docDb = useDocDb();
  const searchApi = useSearchApi();
  const dbCount = await docDb.getCount(db);
  const indexCount = await searchApi.indexDocCount();
  if (dbCount === indexCount) return;
  console.warn(
    `搜索索引与数据库不一致（db=${dbCount}, index=${indexCount}），执行全量重建`,
  );
  const docs = await docDb.getAllForIndex(db);
  await searchApi.reindexAll(docs.map(toIndexInput));
};
