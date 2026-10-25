import { ref } from "vue";

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

interface Key {
  id: string;
  show: string;
}

export function useShortcutRecorder() {
  const isRecording = ref<boolean>(false);
  const shortcutList = ref<Key[]>([]);
  const onEndHandlers = new Set<() => void>();
  const onEnd = (fn: () => void) => {
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
    isRecording.value = true;
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
  };
  const end = () => {
    isRecording.value = false;
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
    shortcutList.value = [];
    onEndHandlers.forEach((fn) => fn());
  };

  return {
    shortcutList,
    start,
    end,
    onEnd,
  };
}
