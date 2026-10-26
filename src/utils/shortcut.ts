import { Shortcut } from "@/types/setting";

// 必须code和key结合使用
// 例如标点符号，应该使用code转换,因为在有shift的场景下，key会被抬升
// 例如英文字母，应该直接用key，因为不同的键盘布局code不足以匹配
// 例如箭头和数字，需要转换为显示需要的
const Punctuation = [
  "Backquote",
  "Minus",
  "Equal",
  "BracketLeft",
  "BracketRight",
  "Backslash",
  "Semicolon",
  "Quote",
  "Comma",
  "Period",
  "Slash",
  "NumpadDivide",
  "NumpadMultiply",
  "NumpadSubtract",
  "NumpadAdd",
  "NumpadDecimal",
];

const PUNCTUATION_SYMBOL_MAP: Record<string, string> = {
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  NumpadDivide: "/",
  NumpadMultiply: "*",
  NumpadSubtract: "-",
  NumpadAdd: "+",
  NumpadDecimal: ".",
};

function codeToSymbol(code: string): string | undefined {
  return PUNCTUATION_SYMBOL_MAP[code];
}

function isPunctuation(code: string) {
  return Punctuation.includes(code);
}

function isLetter(code: string) {
  return /^Key[A-Z]$/.test(code);
}

const Arrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

function isArrow(code: string): boolean {
  return Arrow.includes(code);
}

const ARROW_TO_SHOW: Record<string, string> = {
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
};

function arrowToShow(code: string): string | undefined {
  return ARROW_TO_SHOW[code];
}

function normalizeKeyEvent(e: Shortcut) {
  // 标点符号用 code，字母用 key，方向/数字做显示映射
  if (isLetter(e.code)) return e.key.toUpperCase();
  if (isPunctuation(e.code)) return codeToSymbol(e.code) || "";
  if (isArrow(e.code)) return arrowToShow(e.code) || "";
  // 剩下的只有F1-F12和数字，直接用key就行
  return e.key;
}

export function shortcutToShow(s: Shortcut): string {
  const parts: string[] = [];
  if (s.ctrl) parts.push("Ctrl");
  if (s.shift) parts.push("Shift");
  if (s.alt) parts.push("Alt");
  if (s.meta) parts.push("Win");
  const key = normalizeKeyEvent(s);
  parts.push(key);
  return parts.join(" + ");
}

export function shortcutToRegister(s: Shortcut): string {
  const parts: string[] = [];
  if (s.ctrl) parts.push("Ctrl");
  if (s.shift) parts.push("Shift");
  if (s.alt) parts.push("Alt");
  if (s.meta) parts.push("Super");
  parts.push(s.code);
  return parts.join("+");
}
