pub mod migrations;
pub mod search;
pub mod tray;
pub mod window_manager;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:keyflow.db", migrations::get_migrations())
                .add_migrations("sqlite:keyflowdev.db", migrations::get_migrations())
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            search::create_doc_index,
            search::create_index_batch,
            search::delete_index,
            search::delete_index_batch,
            search::search,
        ])
        .setup(|app| {
            tray::setup_tray(app)?;
            window_manager::init_editor_window(app)?;
            // 初始化搜索索引并托管给 tauri 状态
            let index = search::init_index(app.handle())?;
            app.manage(index);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
