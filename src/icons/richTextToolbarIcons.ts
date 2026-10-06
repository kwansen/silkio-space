const icons = {
  // 撤销
  undo: "material-symbols-light:undo-rounded",
  // 重做
  redo: "material-symbols-light:redo-rounded",
  // 加粗
  bold: "material-symbols-light:format-bold-rounded",
  // 斜体
  italic: "material-symbols-light:format-italic-rounded",
  // 下划线
  underline: "material-symbols-light:format-underlined-rounded",
  // 删除线
  strike: "material-symbols-light:strikethrough-s-rounded",
  // 行内代码
  code: "material-symbols-light:code-rounded",
  // 下标
  subscript: "ph:text-subscript-light",
  // 上标
  superscript: "ph:text-superscript-light",
  // 清除文本格式
  reset: "material-symbols-light:ink-eraser-outline-rounded",
  // 段落
  paragraph: "ph:text-t-light",
  // 标题1
  heading1: "material-symbols-light:format-h1-rounded",
  // 标题2
  heading2: "material-symbols-light:format-h2-rounded",
  // 标题3
  heading3: "material-symbols-light:format-h3-rounded",
  // 标题4
  heading4: "material-symbols-light:format-h4-rounded",
  // 标题5
  heading5: "material-symbols-light:format-h5-rounded",
  // 标题6
  heading6: "material-symbols-light:format-h6-rounded",
  // 左对齐
  alignLeft: "material-symbols-light:format-align-left-rounded",
  // 居中对齐
  alignCenter: "material-symbols-light:format-align-center-rounded",
  // 右对齐
  alignRight: "material-symbols-light:format-align-right-rounded",
  // 两端对齐
  alignJustify: "material-symbols-light:format-align-justify-rounded",
  // 无序列表
  bulletList: "ph:list-bullets-light",
  // 有序列表
  orderedList: "ph:list-numbers-light",
  // 任务列表
  taskList: "material-symbols-light:checklist-rounded",
  // 引用块
  blockquote: "material-symbols-light:format-quote-outline-rounded",
  // 高亮
  highlight: "material-symbols-light:stylus-highlighter-outline-rounded",
  // 代码块
  codeBlock: "material-symbols-light:code-blocks-outline-rounded",
  // 分割线
  horizontalRule: "material-symbols-light:horizontal-rule-rounded",
  // 插入链接
  link: "material-symbols-light:link-2-rounded",
  // 插入图片
  image: "material-symbols-light:image-outline-rounded",
  // 公式
  math: "ph:math-operations-light",
  // 全选
  selectAll: "mdi:select-all",
  // 清空内容
  clearContent: "mdi:delete-outline",
} as const;

type Icon = typeof icons[keyof typeof icons];
type IconKey = keyof typeof icons;

export const richTextToolbarIcons = icons;
export type { Icon as RichTextToolbarIcon, IconKey as RichTextToolbarIconKey };