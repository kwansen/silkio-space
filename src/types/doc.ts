export type DocType = "richText" | "mindMap" | "flowChart";

export type SortField =
  | "word_count"
  | "viewed_at"
  | "updated_at"
  | "created_at";

export interface Doc {
  id: string;
  title: string | null;
  content: string | null;
  plain_text: string | null;
  doc_type: DocType;
  word_count: number;
  viewed_at: number;
  created_at: number;
  updated_at: number;
  // 软删除墓碑：NULL 未删除，非 NULL 为删除时间戳（正常查询已过滤，仅回收站/同步场景使用）
  deleted_at: number | null;
}

export interface ScoredDoc extends Doc {
  score: number;
}

// 用作目录列表
export interface DocEntry extends Omit<Doc, "content" | "plain_text"> {}
