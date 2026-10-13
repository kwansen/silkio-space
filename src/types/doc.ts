export type DocType = "richText" | "mindMap" | "flowChart";
// 可排序字段：仅字数与三种时间
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
}

export interface ScoredDoc extends Doc {
  score: number;
}
