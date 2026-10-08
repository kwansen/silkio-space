import { useDocSvc } from "@/services/document.ts";

// useDocuments.ts: 文档组合式函数，提供文档创建等业务能力
// 元函数：获取文档服务单例（模块顶层允许 await，内部已同步维护搜索索引）
const docSvc = await useDocSvc();

export const useDoc = () => {
  // 元函数：生成富文本默认内容（空段落 JSON）
  const defaultContent = () => JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

  // 元函数：创建富文本文档并返回文档 id
  const createRichText = async (): Promise<string> => {
    return docSvc.create({ title: "", content: defaultContent(), plain_text: "", doc_type: "richText" });
  };

  // 元函数：创建思维导图文档（默认根节点）并返回文档 id
  const createMindMap = async (): Promise<string> => {
    const data = JSON.stringify({ data: { text: "根节点" }, children: [] });
    return docSvc.create({ title: "", content: data, plain_text: "根节点", doc_type: "mindMap" });
  };

  // 元函数：创建流程图文档并返回文档 id
  const createFlowChart = async (): Promise<string> => {
    return docSvc.create({ title: "", content: "", plain_text: "", doc_type: "flowChart" });
  };

  // 元函数：更新富文本文档的内容与纯文本
  const updateContent = async (id: string, content: string, plainText: string): Promise<void> => {
    return docSvc.update(id, { content, plain_text: plainText });
  };

  // 元函数：更新富文本文档的标题
  const updateTitle = async (id: string, title: string): Promise<void> => {
    return docSvc.update(id, { title });
  };

  return { createRichText, createMindMap, createFlowChart, updateContent, updateTitle };
};
