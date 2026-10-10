### 1. document（文档表）

| 字段         | 类型            | 说明       |
| ---------- | ------------- | -------- |
| id         | BIGINT        | 主键       |
| title      | VARCHAR(255)  | 文档标题     |
| content    | LONGTEXT      | 文档内容     |
| created_at | DATETIME      | 创建时间     |
| updated_at | DATETIME      | 更新时间     |

### 2. folder（知识库 / 文件夹表）

| 字段         | 类型            | 说明                  |
| ---------- | ------------- | ------------------- |
| id         | BIGINT        | 主键                  |
| name       | VARCHAR(255)  | 知识库或文件夹名称           |
| parent_id  | BIGINT NULL   | 父级文件夹 ID，NULL 表示知识库 |
| sort_order | INT           | 同级文件夹的排序值           |
| created_at | DATETIME      | 创建时间                |
| updated_at | DATETIME      | 更新时间                |

### 3. folder_document（文件夹与文档关联表）

| 字段          | 类型       | 说明            |
| ----------- | -------- | ------------- |
| id          | BIGINT   | 主键            |
| folder_id   | BIGINT   | 文件夹 ID        |
| document_id | BIGINT   | 文档 ID         |
| sort_order  | INT      | 文档在当前文件夹中的排序值 |
| created_at  | DATETIME | 创建时间          |
| updated_at  | DATETIME | 更新时间          |

建议增加以下约束：

* `folder_document` 对 `(folder_id, document_id)` 建立唯一索引，防止同一文档重复关联同一文件夹。

* `folder.parent_id` 建立索引。

* `folder_document.folder_id` 建立索引。

* `folder_document.document_id` 建立索引。

注意： `folder.sort_order` 只负责文件夹之间的排序，`folder_document.sort_order` 只负责文档之间的排序。如果需要文件夹与文档在同一个列表内混合拖拽排序，就需要改成统一的目录项表模型。
