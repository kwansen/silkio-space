// migrations.rs: 数据库迁移模块，定义所有迁移并提供初始化方法
use tauri_plugin_sql::{Migration, MigrationKind};

// 获取所有迁移
pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/0001.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_delete_cascade_triggers",
            sql: include_str!("../migrations/0002.sql"),
            kind: MigrationKind::Up,
        },
    ]
}
