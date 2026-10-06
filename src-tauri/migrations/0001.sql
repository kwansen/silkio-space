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

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT,
    plain_text TEXT,
    doc_type TEXT NOT NULL DEFAULT 'document',
    word_count INTEGER NOT NULL,
    viewed_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
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
    sort_order INTEGER NOT NULL DEFAULT 0,
    viewed_at INTEGER,
    created_at INTEGER,
    updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS folder_document (
    id TEXT,
    folder_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    PRIMARY KEY (folder_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_fd_index_folder ON folder_document(folder_id);
CREATE INDEX IF NOT EXISTS idx_fd_index_doc ON folder_document(document_id);

CREATE TABLE IF NOT EXISTS document_images (
    doc_id TEXT NOT NULL,
    image_path TEXT NOT NULL,
    PRIMARY KEY (doc_id, image_path)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT,
    error TEXT,
    created_at INTEGER NOT NULL,
    retry_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending'
);
