import { ref, onUnmounted } from "vue";

export function useShortcutRecorder() {
  const shortcutList = ref<string[]>([]);
  const MODIFIERS = ["Control", "Shift", "Alt", "Meta"] as const;
  type Modifier = (typeof MODIFIERS)[number];

  function isMainKey(e: KeyboardEvent) {
    const code = e.code;
    // 字母区
    if (/^Key[A-Z]$/.test(code)) return true;
    // 右侧数字区
    if (/^Numpad\d$/.test(code)) return true;
    // 右侧数字区
    if (/^Digit\d$/.test(code)) return true;
    // 功能键
    if (/^F\d{1,2}$/.test(code)) return true;
    // 方向键
    if (/^Arrow/.test(code)) return true;
    // 编辑键
    // const ALLOWED = new Set([
    //     'Enter',
    //     'Escape',
    //     'Backspace',
    //     'Delete',
    //     'Space'
    // ]);
    // return ALLOWED.has(code);
  }

  function handleKeyDown(e: KeyboardEvent) {
    e.stopPropagation();
    e.preventDefault();
  }

  function handleKeyUp(e: KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isMainKey(e)) return;

    const modifiers: Modifier[] = [
      e.ctrlKey && "Control",
      e.shiftKey && "Shift",
      e.altKey && "Alt",
      e.metaKey && "Meta",
    ].filter(Boolean) as Modifier[];

    if (modifiers.length > 2) return;
    if (modifiers.length < 1) return;

    shortcutList.value = [
      ...MODIFIERS.filter((m) => modifiers.includes(m)),
      e.key,
    ];
  }
  const startRecordShortcut = () => {
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
  };

  const stopRecordShortcut = () => {
    window.removeEventListener("keydown", handleKeyDown, true);
    window.removeEventListener("keyup", handleKeyUp, true);
    shortcutList.value = [];
  };

  onUnmounted(() => {
    stopRecordShortcut();
  });

  return {
    shortcutList,
    startRecordShortcut,
    stopRecordShortcut,
  };
}
