# LeftBar 导航文件夹树：新建文件夹 + 拖拽入文件夹

## Context

编辑器窗口 LeftBar 的 nav（NavMain）目前只展示当前归档下的一层文档列表（vuedraggable 平铺排序）。需求：

1. 支持在导航中新建文件夹（子文件夹），并在导航中以树形展示（文件夹在前、文档在后）。
2. 文档和文件夹都可拖拽进文件夹（含折叠的文件夹行、容器空白区），支持同级排序。
3. 顶部「+」菜单的「文件夹」项：选中了某个文件夹时新建在该文件夹内，否则建在归档根目录（用户已确认）。
4. 删除子文件夹时递归删除（删除 folders 行 + 子树 folder_document 关联，documents 表文档本体保留）（用户已确认）。

数据层已有基础：`folders.parent_id` 字段存在但恒为 null；`folder_document` 为 归档/文件夹 ↔ 文档 多对多关联（按 folder_id 维护 sort_order）。`folder_document` 无外键无级联，需手动级联。

拖拽方案：**原生 HTML5 DnD**（VS Code 文件树模式），不引入新依赖。已调研 `@formkit/drag-and-drop`（无成熟 tree 支持）与 SortableJS 嵌套（行级"放入"与插入排序冲突难以干净处理）。`vuedraggable` 保留给主窗口 `DocList` 使用。

## 一、数据层

### `src/infrastructure/db/folder.ts`
- `getSorted`：加 `WHERE parent_id IS NULL`（主窗口归档列表/搜索只列根归档，防止子文件夹混入主窗口）。
- `create`：`params.parent_id` 非空时 sort_order 取该父级下 `MAX(sort_order)+1`（追加到末尾）；根归档维持现状（0）。
- 新增 `getChildren(parentId)`：`WHERE parent_id = $1 ORDER BY sort_order ASC, created_at ASC`。
- 新增 `setParent(id, parentId)`。
- 新增 `getDescendantIds(id)`：`WITH RECURSIVE` CTE 返回子树 id（不含自身）。
- 新增 `hasDocInSubtree(folderId, docId)`：`SELECT EXISTS(WITH RECURSIVE sub ... JOIN folder_document ...)`。
- 新增 `getFirstDocInSubtree(folderId)`：优先根容器第一篇（保持现语义），否则子树中第一篇。
- `remove` 改为级联：CTE 收集子树 id（含自身）→ 两条 execute（tauri-plugin-sql 单次仅一条语句，且必须先删 `folder_document` 再删 `folders`；IN 占位符拼 `$1,$2,...`，参照 `document.ts` removeMany 现有模式）。顺带修复现存问题：旧 remove 会遗留孤儿 folder_document 行。

### `src/services/folder.ts`
- 暴露 `getChildren`、`setParent`、`getDescendantIds`、`hasDocInSubtree`、`getFirstDocInSubtree`；`remove` 即级联删除。
- 新增 `removeDocFromSubtree(folderId, docId)`：从子树所有容器的 folder_document 中移除该文档（导航内删除文档图标用）。

## 二、状态层

### 新增 `src/stores/navTree.ts`（pinia）
- `selectedFolderId: string | null`（导航中选中的文件夹；NavHeader 新建目标 = 它 ?? 当前归档 id）。
- `expandedIds: Set<string>`（折叠状态存 store，树刷新不丢失）。
- `version: number` + `bump()`（本地操作后触发树重载）。
- 归档切换（`store.folder.id` 变化）时重置 `selectedFolderId`。

## 三、组件层（src/components/sections/LeftBar/）

### 重写 `NavMain.vue`
- 根容器渲染新的递归 `NavTree.vue`（containerId = `store.folder.id`）。
- 文件夹和文档都为空时渲染 `NavEmpty`。
- 挂 `ArchiveRenameDialog`（复用，重命名子文件夹）与新增 `FolderRemoveDialog.vue`（仿 `DocRemoveDialog` 样式的递归删除确认弹窗）。

### 新增 `NavTree.vue`（递归 SFC，`defineOptions({ name: "NavTree" })`）
- props：`containerId: string`、`depth: number`。加载子级 `{ folders, docs }`（watch containerId + navTree.version），子容器左缩进按 depth。
- 文件夹行：chevron（展开/收起）+ `mdi:folder-outline` + 名称；点击 = 选中 + 切换展开；悬停显示铅笔（重命名弹窗）与删除（确认后级联删除，删除当前选中项时重置 selectedFolderId）。
- 文档行：沿用现有样式与行为（图标 `docTypeIcons[doc_type]`、点击 openDoc、悬停删除图标 → `DocRemoveDialog`，删除时用 `removeDocFromSubtree`）。
- 各级 NavTree 自行 watch `store.doc` 同步在树中的文档标题。

### 原生 DnD（模块级共享状态放 `src/composables/useNavTree.ts`）
- `dragging: { kind: 'doc'|'folder'; id; descendantIds } | null`（descendantIds 在 dragstart 时快照，用于环检测：目标文件夹是自身或其后代 → 拒绝）。
- `dropIndicator: { containerId; kind; id; zone: 'before'|'after'|'into' } | null`，渲染为插入线/放入高亮。
- 命中区：文件夹行上下 25% = before/after（仅文件夹拖拽）、中间 50% = into；文档行上下半 = before/after；拖文档悬停文件夹行任意位置 = into；容器空白区 = 追加到末尾。dragover 需 `preventDefault()` + `dropEffect='move'`；dragleave 用 relatedTarget 防闪烁；dragend 清理全部状态与悬停自动展开定时器（600ms hover 自动展开折叠文件夹）。
- 落库：
  - 文档移动 = `folderDocumentDb.remove(源容器, doc)` + `add(目标容器, doc)`（追加末尾）；同级排序 = `folderDocumentDb.reorder(容器, ids)`（已有函数）。
  - 文件夹移动 = `setParent` + 复用 `folderDb.reorder(新同级 ids)`；同级排序同。
  - 任何持久化成功后 `bump()` + `notifyMainRefresh()`（沿用现有模式，失败 console.error 不回滚 UI 之外的处理与现有一致）。

### `NavHeader.vue`
- `handleCreateFolder`：目标容器 = `navTree.selectedFolderId ?? store.folder.id`，名称「新建文件夹」；创建后选中并展开新文件夹 + `bump()`。
- `createDoc` 的 `folderSvc.addDoc` 目标同步改为 `selectedFolderId ?? store.folder.id`（与文件夹入口一致）。

### `EditorView.vue`（folderChange / open 兜底修正）
- folderChange 处理器：`getDocs(folderId).some(...)` 改为 `hasDocInSubtree(folderId, docId)`；兜底切换文档用 `getFirstDocInSubtree(folderId)`（否则根层无直接文档时会错误清空）。
- `open` 事件打开归档：`getFirstDoc` 改为 `getFirstDocInSubtree`（否则文档全在子文件夹时打开归档显示为空）。

## 不改动
主窗口 DocList/DocSort/DocSearch（基于全局 documents 表）；ArchivePickerDialog 只列根归档（getSorted 过滤后的自然结果）。

## 验证
1. `pnpm build`（vue-tsc 类型检查 + vite 构建）通过。
2. `pnpm tauri dev` 手动验证：
   - 选中/未选中文件夹时经顶部「+」分别新建到文件夹内/归档根目录；
   - 拖文档进文件夹（展开行中间、折叠行、空白区），拖文件夹进文件夹，拖自身/后代文件夹被拒绝；
   - 同级拖拽排序刷新后保持；删除子文件夹确认后文档本体仍在全部文档中；
   - 主窗口归档列表与搜索不出现子文件夹；主窗口删除归档后子文件夹不残留；
   - 打开含子文件夹文档的归档能显示第一篇文档；重命名弹窗正常。
