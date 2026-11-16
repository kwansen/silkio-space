// IndexedDB 持久化：导图文档的存取（新建/打开/自动保存/删除）。
// 单对象仓库 mindmaps，主键 id；记录内嵌完整数据树与布局/连线偏好，
// 打开时可整场景还原（数据 + direction + edgeStyle）。
import type { EdgeShape } from "@silkor/core";
import type { MindMapNode } from "silkio-mindmap";

export interface MindMapDoc {
  id: string;
  name: string;
  data: MindMapNode;
  direction: "left" | "right" | "down" | "both";
  edgeStyle: EdgeShape;
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = "silker-demo-mindmap";
const STORE = "mindmaps";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// 每次操作独立开库/关库：demo 规模足够，避免连接生命周期管理
async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export function listDocs(): Promise<MindMapDoc[]> {
  return withStore("readonly", (s) => s.getAll() as IDBRequest<MindMapDoc[]>);
}

export function getDoc(id: string): Promise<MindMapDoc | undefined> {
  return withStore(
    "readonly",
    (s) => s.get(id) as IDBRequest<MindMapDoc | undefined>,
  );
}

export function putDoc(doc: MindMapDoc): Promise<IDBValidKey> {
  return withStore("readwrite", (s) => s.put(doc));
}

export function deleteDoc(id: string): Promise<undefined> {
  return withStore("readwrite", (s) => s.delete(id));
}
