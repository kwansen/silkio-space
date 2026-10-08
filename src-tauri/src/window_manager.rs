// window_manager.rs: 窗口管理模块，在应用启动时创建编辑器窗口

// use tauri::Manager;

// 在 setup 阶段初始化编辑器窗口
// pub fn init_editor_window(app: &mut tauri::App) -> tauri::Result<()> {
//     if app.get_webview_window("editor").is_none() {
//         tauri::WebviewWindowBuilder::new(
//             app,
//             "editor",
//             tauri::WebviewUrl::App("index.html".into()),
//         )
//         .title("文档编辑")
//         .inner_size(800.0, 600.0)
//         .min_inner_size(600.0, 450.0)
//         .decorations(false)
//         .visible(false)
//         .disable_drag_drop_handler()
//         .build()?;
//     }
//     Ok(())
// }
