-- v1 初始表
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    command TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    display INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    display INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snippets_category_id ON snippets(category_id);

-- 软删除：deleted_at 为 NULL 表示未删除，非 NULL 为删除时间戳（墓碑，供回收站与未来同步）
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    plain_text TEXT,
    doc_type TEXT NOT NULL ,
    word_count INTEGER NOT NULL,
    viewed_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_viewed_at ON documents(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_type_created_at ON documents(doc_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_type_updated_at ON documents(doc_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_type_viewed_at ON documents(doc_type, viewed_at DESC);

CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    sort_order INTEGER NOT NULL,
    viewed_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

CREATE TABLE IF NOT EXISTS folder_document (
    folder_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY (folder_id, document_id)
);
CREATE INDEX IF NOT EXISTS idx_folder_document_document ON folder_document (document_id);

-- 删除级联清理（tauri-plugin-sql 单次仅执行一条语句，应用层无法跨语句事务；
-- 改用 trigger 保证「删本体 + 清关联」原子生效，应用层删除不再需要先删关联）

-- 文档物理删除时级联清理其全部归档关联（folder_document，软删除仅标记 deleted_at 不触发）
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