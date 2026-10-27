// window_manager.rs: 窗口管理模块，在应用启动时创建编辑器窗口

use tauri::Manager;

// 在 setup 阶段初始化编辑器窗口
pub fn create_search_window(app: &mut tauri::App) -> tauri::Result<()> {
    // 1. 获取显示器信息
    let primary_monitor = app.primary_monitor().unwrap().unwrap();
    // 物理像素的工作区
    let work_area = primary_monitor.work_area();
    let dpi = primary_monitor.scale_factor();

    // 2. 定义窗口的逻辑尺寸 (窗口在 100% 缩放下的尺寸)
    let window_width_logical = 720.0;
    let window_height_logical = 624.0;

    // 3. 将屏幕工作区转换为逻辑尺寸
    // 这样屏幕坐标和窗口坐标就在同一个世界了，不需要反复乘除
    let screen_width_logical = work_area.size.width as f64 / dpi;

    // 4. 计算居中的逻辑坐标
    // 公式：(屏幕逻辑宽 - 窗口逻辑宽) / 2
    let x_logical = (screen_width_logical - window_width_logical) / 2.0;
    let y_logical = 100.0; // 假设 Y 轴偏移

    // 5. 计算相对于屏幕左上角的最终逻辑坐标
    // work_area.position 是物理坐标，需要转为逻辑坐标作为基准
    let origin_x_logical = work_area.position.x as f64 / dpi;
    let origin_y_logical = work_area.position.y as f64 / dpi;

    let final_x = origin_x_logical + x_logical;
    let final_y = origin_y_logical + y_logical;

    // 6. 创建窗口
    // Tauri 的 position 接收的就是逻辑像素
    if app.get_webview_window("search").is_none() {
        tauri::WebviewWindowBuilder::new(
            app,
            "search",
            tauri::WebviewUrl::App("index.html".into()),
        )
        .decorations(false)
        .shadow(false)
        .always_on_top(true)
        .transparent(true)
        .visible(false)
        .skip_taskbar(true)
        .position(final_x, final_y) // 直接传入计算好的逻辑坐标
        .inner_size(window_width_logical, window_height_logical) // 设置逻辑尺寸
        .build()?;
    }
    Ok(())
}
