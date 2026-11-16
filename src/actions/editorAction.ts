import { notifyDocChanged } from "@/infrastructure/api/windowEvent";
import { useDocSvc } from "@/services/document";
import { useEditorStore } from "@/stores/editorStore";

const SAVE_DELAY = 1000;

// docSvc 必须惰性获取：useDocSvc → getDb 在模块加载期执行会早于 initDb()，
// 抛「DB 未初始化」；改为各使用点调用时取（getDb 内部已单例缓存，无开销）

// 挂起的内容保存：调用瞬间锁定目标文档 id，落库时只写该 id，
// 杜绝「编辑 A 后快速切到 B，A 的内容串写进 B」；snapshot 为调用时刻的
// 落库快照，用于跳过无变化保存（store 快照会随切换被新文档接管，不可延迟读取）
interface PendingContent {
  docId: string;
  content: string;
  plain_text: string;
  word_count: number;
  snapshot: string;
}

interface PendingTitle {
  docId: string;
  title: string;
  snapshot: string;
}

// 以下状态全部模块级单例：useEditorAction 会在多个组件中各自实例化，
// 挂起保存与切换序号必须全局唯一，否则串行化与竞态守卫失效
let pendingContent: PendingContent | null = null;
let contentTimer: ReturnType<typeof setTimeout> | null = null;
let contentChain: Promise<void> = Promise.resolve();
let pendingTitle: PendingTitle | null = null;
let titleTimer: ReturnType<typeof setTimeout> | null = null;
let titleChain: Promise<void> = Promise.resolve();

// 打开/切换序号：异步取数后只有最新一次请求允许 setDoc，
// 防止快速连续打开时先发请求后返回、覆盖后发请求的结果（标题内容错乱）
let switchSeq = 0;

// 串行落库挂起内容：promise 链保证并发 flush 有序；flush 进行中新产生的
// 挂起会在循环尾部被再次捡起，同一文档多次写入始终按编辑顺序落库
const flushContent = (): Promise<void> => {
  contentChain = contentChain.then(async () => {
    while (pendingContent) {
      const p = pendingContent;
      pendingContent = null;
      if (p.content === p.snapshot) continue;
      try {
        await useDocSvc().update(p.docId, {
          content: p.content,
          plain_text: p.plain_text,
          word_count: p.word_count,
        });
        // 快照仅当目标仍是当前文档时同步（切换后快照已被新文档接管）
        const store = useEditorStore();
        if (store.id === p.docId) store.oldContent = p.content;
        notifyDocChanged();
      } catch (e) {
        pendingContent ??= p;
        console.error(e);
      }
    }
  });
  return contentChain;
};

const flushTitle = (): Promise<void> => {
  titleChain = titleChain.then(async () => {
    while (pendingTitle) {
      const p = pendingTitle;
      pendingTitle = null;
      if (p.title === p.snapshot) continue;
      try {
        await useDocSvc().update(p.docId, { title: p.title });
        const store = useEditorStore();
        if (store.id === p.docId) store.oldTitle = p.title;
        notifyDocChanged();
      } catch (e) {
        pendingTitle ??= p;
        console.error(e);
      }
    }
  });
  return titleChain;
};

// 切换文档前调用：立刻落库旧文档挂起的编辑，避免丢失或串写到新文档
const flushPendingSaves = async (): Promise<void> => {
  if (contentTimer) {
    clearTimeout(contentTimer);
    contentTimer = null;
  }
  if (titleTimer) {
    clearTimeout(titleTimer);
    titleTimer = null;
  }
  await Promise.all([flushContent(), flushTitle()]);
};

// 统一打开/切换入口：先落库旧文档挂起编辑 → 取数 → 序号校验 → setDoc。
// 快速连续打开时，旧的异步取数结果会被序号守卫丢弃，只有最后一次生效。
// 进入即同步置位 switching 遮住编辑区（先于任何 await），避免切换间隙
// 残留上一个文档造成闪烁；遮罩由编辑器就绪信号（showWindow）或空态兜底解除
const openDocById = async (docId: string | null): Promise<void> => {
  const seq = ++switchSeq;
  const store = useEditorStore();
  store.setSwitching(true);
  try {
    await flushPendingSaves();
    const doc = docId ? await useDocSvc().getById(docId) : null;
    if (seq !== switchSeq) return;
    store.setDoc(doc);
    // 空文档 / 无 docType 没有编辑器挂载、不会有就绪信号，直接解除遮罩
    if (!doc || !doc.doc_type) store.setSwitching(false);
  } catch (e) {
    if (seq === switchSeq) store.setSwitching(false);
    console.error(e);
  }
};

export const useEditorAction = () => {
  // 调用瞬间锁定当前文档 id：延迟落库只写这个 id，杜绝跨文档串写
  const saveContent = (
    content: string,
    plain_text: string,
    word_count: number,
  ) => {
    const store = useEditorStore();
    const docId = store.id;
    if (!docId) return;
    pendingContent = {
      docId,
      content,
      plain_text,
      word_count,
      snapshot: store.oldContent,
    };
    if (contentTimer) clearTimeout(contentTimer);
    contentTimer = setTimeout(flushContent, SAVE_DELAY);
  };

  const saveTitle = (v: string) => {
    const store = useEditorStore();
    const docId = store.id;
    if (!docId) return;
    pendingTitle = { docId, title: v, snapshot: store.oldTitle };
    if (titleTimer) clearTimeout(titleTimer);
    titleTimer = setTimeout(flushTitle, SAVE_DELAY);
  };

  return { saveContent, saveTitle, flushPendingSaves, openDocById };
};
