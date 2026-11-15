-- v2 删除级联清理（tauri-plugin-sql 单次仅执行一条语句，应用层无法跨语句事务；
-- 改用 trigger 保证「删本体 + 清关联」原子生效，应用层删除不再需要先删关联）

-- 文档删除时级联清理其全部归档关联（folder_document）
CREATE TRIGGER trg_documents_delete_cleanup
AFTER DELETE ON documents
BEGIN
    DELETE FROM folder_document WHERE document_id = OLD.id;
END;

-- 归档删除时级联清理其全部文档关联（folder_document，文档本体保留）
CREATE TRIGGER trg_folders_delete_cleanup
AFTER DELETE ON folders
BEGIN
    DELETE FROM folder_document WHERE folder_id = OLD.id;
END;
