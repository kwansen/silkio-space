// IndexedDB 持久化：流程图文档的存取（新建/打开/自动保存/重命名/删除）。
// 单对象仓库 flowcharts，主键 id；记录内嵌整图数据（节点 + 连线，含稳定 id），
// 打开时经 FlowChart.setData 整图还原。与 demo-mindmap 的 idb.ts 同构。
import type { FlowData } from "silkio-flowchart";

export interface FlowChartDoc {
  id: string;
  name: string;
  data: FlowData;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_DOC_NAME = "未命名流程图";

const DB_NAME = "silker-demo-flowchart";
const STORE = "flowcharts";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("当前环境不支持 IndexedDB"));
      return;
    }
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

// 每次操作独立开库/关库：demo 规模足够，避免连接生命周期管理。
// 写操作等到事务提交后才 resolve，保证 beforeunload/切换前落盘的语义可靠。
async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    let result!: T;
    req.onsuccess = () => {
      result = req.result;
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? req.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? req.error);
    };
  });
}

export function listDocs(): Promise<FlowChartDoc[]> {
  return withStore("readonly", (s) => s.getAll() as IDBRequest<FlowChartDoc[]>);
}

export function getDoc(id: string): Promise<FlowChartDoc | undefined> {
  return withStore(
    "readonly",
    (s) => s.get(id) as IDBRequest<FlowChartDoc | undefined>,
  );
}

export function putDoc(doc: FlowChartDoc): Promise<IDBValidKey> {
  return withStore("readwrite", (s) => s.put(doc));
}

export function deleteDoc(id: string): Promise<undefined> {
  return withStore("readwrite", (s) => s.delete(id));
}
