import { type Component } from "vue";

export interface Btn {
  name: string;
  icon: Component;
  shortcut: string;
  action: () => void;
  disabled: () => boolean;
  active: () => boolean;
}
