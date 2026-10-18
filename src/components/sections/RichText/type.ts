import { type Component } from "vue";

export interface Btn {
  name: string;
  icon: Component;
  shortcut: string;
  action: () => void;
  disabled: () => boolean;
  active: () => boolean;
}

export interface Group {
  items: GroupItem[];
  divider?: boolean;
}

// 组里装什么（内容语义）
type GroupItem =
  | { kind: "button"; btn: Btn }
  | { kind: "choice"; buttons: Btn[]; icon: Component } // 互斥选项，段落/列表/对齐
  | { kind: "custom"; component: Component }; // 搜索替换
