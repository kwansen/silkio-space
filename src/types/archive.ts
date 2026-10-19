// 归档对象（viewed_at 为归档自身的最近打开时间，null 表示从未打开）
export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  viewed_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface Archive extends Folder {}
