import { ref } from "vue";

//#region code声明
const F = [
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
];
const Digit = [
  "Digit0",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
];
const Numpad = [
  "Numpad0",
  "Numpad1",
  "Numpad2",
  "Numpad3",
  "Numpad4",
  "Numpad5",
  "Numpad6",
  "Numpad7",
  "Numpad8",
  "Numpad9",
];

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
const Letter = [
  "KeyA",
  "KeyB",
  "KeyC",
  "KeyD",
  "KeyE",
  "KeyF",
  "KeyG",
  "KeyH",
  "KeyI",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyM",
  "KeyN",
  "KeyO",
  "KeyP",
  "KeyQ",
  "KeyR",
  "KeyS",
  "KeyT",
  "KeyU",
  "KeyV",
  "KeyW",
  "KeyX",
  "KeyY",
  "KeyZ",
];
const Arrow = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
//#endregion

const mainKeyList = [
  ...F,
  ...Digit,
  ...Numpad,
  ...Punctuation,
  ...Letter,
  ...Arrow,
];

const isMainKey = (event: KeyboardEvent) => {
  const code = event.code;
  return mainKeyList.includes(code);
};

export interface Key {
  id: string;
  show: string;
}

// 全局同一时间只允许一个录制器处于录制状态
let activeRecorder: { end: () => void } | null = null;

export function useShortcutRecorder() {
  const isRecording = ref<boolean>(false);
  const shortcutList = ref<Key[]>([]);
  const onEndHandlers = new Set<(keys: Key[]) => void>();
  const onEnd = (fn: (keys: Key[]) => void) => {
    onEndHandlers.add(fn);
    return () => onEndHandlers.delete(fn);
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    event.preventDefault();
    let mainKey;
    if (isMainKey(event)) {
      mainKey = {
        id: event.code,
        show: event.key.toUpperCase(),
      };
    }
    const mods = [];
    if (event.ctrlKey) mods.push({ id: "ctrl", show: "Ctrl" });
    if (event.shiftKey) mods.push({ id: "shift", show: "Shift" });
    if (event.altKey) mods.push({ id: "alt", show: "Alt" });
    if (event.metaKey) mods.push({ id: "meta", show: "Meta" });
    if (mainKey) mods.push(mainKey);
    shortcutList.value = mods;
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    event.stopPropagation();
    event.preventDefault();
    end();
  };
  const start = () => {
    if (isRecording.value) return;
    activeRecorder?.end();
    activeRecorder = { end };
    isRecording.value = true;
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
  };
  const end = () => {
    if (!isRecording.value) return;
    if (activeRecorder?.end === end) activeRecorder = null;
    isRecording.value = false;
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
    const keys = shortcutList.value;
    shortcutList.value = [];
    onEndHandlers.forEach((fn) => fn(keys));
  };

  return {
    isRecording,
    shortcutList,
    start,
    end,
    onEnd,
  };
}
