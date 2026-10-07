// invertedIndex.ts: 仅针对标题的内存倒排索引（词项 → id → 词频）
// 分词规则：连续拉丁字母/数字合并为一个词（转小写），CJK 字符逐字成词

// 元函数：将标题切分为词项列表
const tokenize = (text: string): string[] => {
  const tokens: string[] = [];
  // 拉丁字母/数字按连续段成词
  tokens.push(...(text.toLowerCase().match(/[a-z0-9]+/g) ?? []));
  // CJK 逐字成词
  for (const ch of text) {
    if (/[\u3400-\u9fff]/.test(ch)) tokens.push(ch);
  }
  return tokens;
};

export class TitleInvertedIndex {
  // 词项 → (id → 词频)
  private postings = new Map<string, Map<string, number>>();
  // id → 词项列表（用于按 id 高效删除）
  private docTerms = new Map<string, string[]>();
  // id → 加入序号（同分时按加入顺序稳定排序）
  private docSeq = new Map<string, number>();
  private seq = 0;

  // 元函数：添加/重建一个标题的索引（重复添加自动覆盖旧索引）
  add(id: string, title: string): void {
    this.remove(id);
    const tf = new Map<string, number>();
    for (const t of tokenize(title)) tf.set(t, (tf.get(t) ?? 0) + 1);
    const terms = [...tf.keys()];
    if (terms.length === 0) return;
    this.docTerms.set(id, terms);
    this.docSeq.set(id, this.seq++);
    for (const [t, n] of tf) {
      let list = this.postings.get(t);
      if (!list) this.postings.set(t, (list = new Map()));
      list.set(id, n);
    }
  }

  // 元函数：按 id 移除索引（未索引过的 id 静默忽略）
  remove(id: string): void {
    const terms = this.docTerms.get(id);
    if (!terms) return;
    for (const t of terms) {
      const list = this.postings.get(t);
      list?.delete(id);
      if (list?.size === 0) this.postings.delete(t);
    }
    this.docTerms.delete(id);
    this.docSeq.delete(id);
  }

  // 元函数：清空全部索引
  clear(): void {
    this.postings.clear();
    this.docTerms.clear();
    this.docSeq.clear();
    this.seq = 0;
  }

  // 元函数：搜索命中的 id 列表
  // AND 语义：标题需包含全部分词；末词按前缀匹配（适配输入进行中的场景）
  // 得分 = 各命中词项词频之和，降序返回（同分保持加入顺序）
  search(query: string): string[] {
    const tokens = [...new Set(tokenize(query))];
    if (tokens.length === 0) return [];
    // 末词候选集 = 全部前缀匹配词项倒排表的并集
    const prefix = tokens[tokens.length - 1];
    const prefixTerms = [...this.postings.keys()].filter((t) =>
      t.startsWith(prefix),
    );
    if (prefixTerms.length === 0) return [];
    const acc = new Map<string, number>();
    for (const t of prefixTerms) {
      for (const [id, n] of this.postings.get(t)!) {
        acc.set(id, (acc.get(id) ?? 0) + n);
      }
    }
    // 其余词项逐词求交集并累加词频得分
    for (const t of tokens.slice(0, -1)) {
      const list = this.postings.get(t);
      if (!list) return [];
      for (const id of acc.keys()) {
        if (!list.has(id)) acc.delete(id);
        else acc.set(id, (acc.get(id) ?? 0) + list.get(id)!);
      }
      if (acc.size === 0) return [];
    }
    return [...acc.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1] ||
          (this.docSeq.get(a[0]) ?? 0) - (this.docSeq.get(b[0]) ?? 0),
      )
      .map(([id]) => id);
  }
}
