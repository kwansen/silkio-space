// 画布实例注册表：AI 面板（RightBar/aiAction）与画布组件（MindMap/FlowChart）
// 解耦——组件挂载时注册活实例、卸载时注销；AI 编辑经实例自带的 ai 控制器
// （mindmap.ai.run）或整图生成入口（flowchart.generate）执行，实例仅存内存，
// 不入 pinia（非序列化状态，也无跨组件响应需求）
import type { MindMap } from "silkio-mindmap";
import type { FlowChart } from "silkio-flowchart";

let mindMapInstance: MindMap | null = null;
let flowChartInstance: FlowChart | null = null;

export const setMindMapInstance = (instance: MindMap | null) => {
  mindMapInstance = instance;
};
export const getMindMapInstance = () => mindMapInstance;

export const setFlowChartInstance = (instance: FlowChart | null) => {
  flowChartInstance = instance;
};
export const getFlowChartInstance = () => flowChartInstance;
