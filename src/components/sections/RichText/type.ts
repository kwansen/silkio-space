import { type Component } from "vue";

type GroupType = "inline" | "grouped";

export interface Btn {
  name: string;
  icon: Component;
  shortcut: string;
  action: () => void;
  disabled: () => boolean;
  active: () => boolean;
}

export interface Group {
  name: string;
  button: Btn[];
  type: GroupType;
  groupIcon: Component;
}
