import { Editor } from "@tiptap/core";
import type { FindAndReplaceStorage } from "@tiptap/extension-find-and-replace";
import { computed, onScopeDispose, ref, shallowRef } from "vue";

function createFindAndReplaceState(): FindAndReplaceStorage {
  return {
    searchTerm: "",
    replaceTerm: "",
    caseSensitive: false,
    useRegex: false,
    wholeWord: false,
    results: [],
    currentIndex: null,
  };
}

export function useFindAndReplace() {
  const findAndReplace = ref<FindAndReplaceStorage>(
    createFindAndReplaceState(),
  );
  const editor = shallowRef<Editor | null>(null);

  const resultCount = computed(() => {
    const { results, currentIndex } = findAndReplace.value;

    return results.length === 0
      ? "No results"
      : `${(currentIndex ?? 0) + 1} of ${results.length}`;
  });

  /** 从编辑器存储同步状态到本地 ref */
  const syncState = () => {
    if (editor.value) {
      findAndReplace.value = { ...editor.value.storage.findAndReplace };
    }
  };

  /** 统一执行命令并同步状态，避免各处重复写法 */
  const runCommand = (command: (editor: Editor) => void) => {
    const instance = editor.value;
    if (!instance) return;
    command(instance);
    syncState();
  };

  /** 连接编辑器，返回断开函数便于手动清理 */
  const connect = (nextEditor: Editor) => {
    disconnect();
    editor.value = nextEditor;
    syncState();
    nextEditor.on("transaction", syncState);

    return disconnect;
  };

  const disconnect = () => {
    editor.value?.off("transaction", syncState);
    editor.value = null;
  };

  onScopeDispose(disconnect);

  const setSearchTerm = (term: string) => {
    findAndReplace.value.searchTerm = term;
    runCommand((e) => e.commands.setSearchTerm(term));
  };

  return {
    findAndReplace,
    resultCount,
    connect,
    disconnect,
    setSearchTerm,
    setReplaceTerm: (term: string) =>
      runCommand((e) => e.commands.setReplaceTerm(term)),
    setCaseSensitive: (value: boolean) =>
      runCommand((e) => e.commands.setCaseSensitive(value)),
    setUseRegex: (value: boolean) =>
      runCommand((e) => e.commands.setUseRegex(value)),
    setWholeWord: (value: boolean) =>
      runCommand((e) => e.commands.setWholeWord(value)),
    goToNextResult: () => runCommand((e) => e.commands.goToNextResult()),
    goToPreviousResult: () =>
      runCommand((e) => e.commands.goToPreviousResult()),
    replace: () => runCommand((e) => e.commands.replace()),
    replaceAll: () => runCommand((e) => e.commands.replaceAll()),
    clearSearch: () => runCommand((e) => e.commands.clearSearch()),
  };
}
