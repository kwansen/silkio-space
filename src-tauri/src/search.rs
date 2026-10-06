use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;
use tantivy::schema::*;
use tantivy::tokenizer::TextAnalyzer;
use tantivy::{doc, Index, IndexWriter};
use tantivy_jieba::JiebaTokenizer;
use tauri::Manager;

// 初始化索引，使用 tauri 数据目录持久化索引
pub fn init_index(app: &tauri::AppHandle) -> Result<Index, String> {
    // 获取并创建 tauri 数据目录下的索引路径
    let index_path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("search_index");
    std::fs::create_dir_all(&index_path).map_err(|e| e.to_string())?;
    // 创建schema构造器
    let mut schema_builder = Schema::builder();
    // 添加标题和内容并构造
    let text_indexing = TextFieldIndexing::default()
        .set_tokenizer("jieba")
        .set_index_option(IndexRecordOption::WithFreqsAndPositions);

    let text_options = TextOptions::default()
        .set_indexing_options(text_indexing)
        .set_stored();

    schema_builder.add_text_field("id", STRING);
    schema_builder.add_text_field("title", text_options.clone());
    schema_builder.add_text_field("content", text_options);
    let schema = schema_builder.build();
    // 若目录已有索引则打开，否则创建
    let index = if index_path.join("meta.json").exists() {
        Index::open_in_dir(index_path).map_err(|e| e.to_string())?
    } else {
        Index::create_in_dir(index_path, schema).map_err(|e| e.to_string())?
    };
    let tokenizer = TextAnalyzer::from(JiebaTokenizer::default());
    // 注册jieba分词器，register返回unit类型无需map_err
    index.tokenizers().register("jieba", tokenizer);
    Ok(index)
}

// 从索引schema中取出id、标题、内容字段
pub fn get_fields(index: &Index) -> Result<(Field, Field, Field), String> {
    // 获取schema并查询三个字段
    let schema = index.schema();
    let id_field = schema.get_field("id").map_err(|e| e.to_string())?;
    let title_field = schema.get_field("title").map_err(|e| e.to_string())?;
    let content_field = schema.get_field("content").map_err(|e| e.to_string())?;
    Ok((id_field, title_field, content_field))
}

// 创建单个文档，委托批量创建实现
#[tauri::command]
pub fn create_doc_index(
    state: tauri::State<Index>,
    id: String,
    title: String,
    content: String,
) -> Result<(), String> {
    create_index_batch(state, vec![(id, title, content)])
}

// 批量创建文档并一次性提交
#[tauri::command]
pub fn create_index_batch(
    state: tauri::State<Index>,
    docs: Vec<(String, String, String)>,
) -> Result<(), String> {
    // 获取索引及字段并构建写入器
    let index = state.inner();
    let (id_field, title_field, content_field) = get_fields(index)?;
    let mut writer = index.writer(50_000_000).map_err(|e| e.to_string())?;
    // 循环添加所有文档
    for (id, title, content) in docs {
        writer
            .add_document(doc!(
                id_field => id,
                title_field => title,
                content_field => content))
            .map_err(|e| e.to_string())?;
    }
    // 一次性提交所有文档
    writer.commit().map_err(|e| e.to_string())?;
    Ok(())
}

// 根据 id 删除单个文档，委托批量删除实现
#[tauri::command]
pub fn delete_index(state: tauri::State<Index>, id: String) -> Result<(), String> {
    delete_index_batch(state, vec![id])
}

// 批量删除索引中的文档并一次性提交
#[tauri::command]
pub fn delete_index_batch(state: tauri::State<Index>, ids: Vec<String>) -> Result<(), String> {
    // 获取索引及id字段并构建写入器
    let index = state.inner();
    let (id_field, _, _) = get_fields(index)?;
    let mut writer: IndexWriter<TantivyDocument> =
        index.writer(50_000_000).map_err(|e| e.to_string())?;
    // 循环删除所有 id
    for id in ids {
        writer.delete_term(Term::from_field_text(id_field, &id));
    }
    // 一次性提交删除结果
    writer.commit().map_err(|e| e.to_string())?;
    Ok(())
}

// 搜索结果项
#[derive(serde::Serialize, serde::Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub content: String,
    pub score: f32,
}

// 执行全文搜索，返回匹配的文档列表
#[tauri::command]
pub fn search(state: tauri::State<Index>, query_str: String) -> Result<Vec<SearchResult>, String> {
    // 获取索引及字段并构建搜索器
    let index = state.inner();
    let (id_field, title_field, content_field) = get_fields(index)?;
    let reader = index.reader().map_err(|e| e.to_string())?;
    let searcher = reader.searcher();
    let mut query_parser = QueryParser::for_index(index, vec![title_field, content_field]);
    // 指定字段使用jieba分词器
    // 设置标题命中权重高于内容
    query_parser.set_field_boost(title_field, 3.0);
    let query = query_parser
        .parse_query(&query_str)
        .map_err(|e| e.to_string())?;
    // 执行搜索并返回命中文档，最高一万条
    // TopDocs 需通过 order_by_score 生成按相关度排序的收集器
    let collector = TopDocs::with_limit(10_000).order_by_score();
    let top_docs = searcher
        .search(&query, &collector)
        .map_err(|e| e.to_string())?;
    // 收集命中文档的 id、标题与得分
    let mut results = Vec::new();
    for (score, doc_address) in top_docs {
        let retrieved_doc: tantivy::TantivyDocument =
            searcher.doc(doc_address).map_err(|e| e.to_string())?;
        let id = retrieved_doc
            .get_first(id_field)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let title = retrieved_doc
            .get_first(title_field)
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        results.push(SearchResult {
            id,
            title,
            content: String::new(),
            score,
        });
    }
    Ok(results)
}
