// 归档对象（viewed_at 为归档自身的最近打开时间，null 表示从未打开；
// deleted_at 软删除墓碑：NULL 未删除，非 NULL 为删除时间戳）
export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  viewed_at: number | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Archive extends Folder {}

export interface CheckedArchive extends Folder {
  checked: boolean;
}
