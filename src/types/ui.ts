// 用于切换文档或片段
type AppModeOption = "document" | "snippet";
// 用于切换导航或大纲
type LeftBarOption = "nav" | "outline";
// 用于切换document的TAB
type DocTabOption = "docSort" | "docSearch" | "archiveSort" | "archiveSearch";
// 用于文档排序的方法
type DocSortOption = "viewedAt" | "updatedAt" | "createdAt" | "wordCount";
// 用于归档排序的方法
type ArchiveSortOption = "manual" | "name" | "viewedAt";
// 用于主题切换
type ThemeOption = "light" | "dark";
// 用于切换设置的Tab
type SettingTabOption = "normal" | "shortcut" | "sync" | "about";
// 用于打开richtext的dialog
type RichTextDialog = "link" | "math" | "image" | "";
// 用于编辑器的模式
type EditorMode = "archive" | "doc";
