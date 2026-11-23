pub mod migrations;
pub mod search;
pub mod tray;
pub mod window;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:silkio-space.db", migrations::get_migrations())
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir { file_name: None }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                ])
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            search::create_doc_index,
            search::create_index_batch,
            search::update_doc_index,
            search::update_index_batch,
            search::delete_index,
            search::delete_index_batch,
            search::index_doc_count,
            search::reindex_all,
            search::search,
        ])
        .setup(|app| {
            tray::setup_tray(app)?;
            window::create_search_window(app)?;
            // 初始化搜索状态（writer 仅启动时创建一次）并托管给 tauri 状态
            let state = search::init_search_state(app.handle())?;
            app.manage(state);
            // 后台预热 jieba 词典（懒加载约1s），避免首个文档创建索引时卡顿，且不阻塞窗口显示
            std::thread::spawn(search::warmup_tokenizer);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
