import { Shortcut } from "@/types/setting";
import { ref } from "vue";

//#region code
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

const mainKeyList = [...F, ...Digit, ...Punctuation, ...Letter, ...Arrow];

const isMainKey = (event: KeyboardEvent) => {
  const code = event.code;
  return mainKeyList.includes(code);
};

export function fromKeyboardEvent(e: KeyboardEvent): Shortcut {
  return {
    ctrl: e.ctrlKey,
    shift: e.shiftKey,
    alt: e.altKey,
    meta: e.metaKey,
    code: e.code,
    key: e.key,
  };
}

// 全局同一时间只允许一个录制器处于录制状态
let activeRecorder: { end: () => void } | null = null;

export function useShortcutRecorder() {
  const isRecording = ref<boolean>(false);
  const shortcut = ref<Shortcut>();
  const onEndHandlers = new Set<(shortcut: Shortcut) => void>();
  const onEnd = (fn: (shortcut: Shortcut) => void) => {
    onEndHandlers.add(fn);
    return () => onEndHandlers.delete(fn);
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (isMainKey(event)) {
      shortcut.value = fromKeyboardEvent(event);
    }
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
    if (!shortcut.value) return;
    const keys = shortcut.value;
    shortcut.value = undefined;
    onEndHandlers.forEach((fn) => fn(keys));
  };

  return {
    isRecording,
    shortcut,
    start,
    end,
    onEnd,
  };
}
