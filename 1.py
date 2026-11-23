import os

def rename_files(folder_path):
    """将指定文件夹中所有文件名的中文 × 替换为英文 x"""
    for filename in os.listdir(folder_path):
        if '×' in filename:
            new_name = filename.replace('×', 'x')
            old_path = os.path.join(folder_path, filename)
            new_path = os.path.join(folder_path, new_name)
            
            # 避免覆盖已存在的文件
            if os.path.exists(new_path):
                print(f"跳过（目标已存在）: {filename}")
                continue
            
            os.rename(old_path, new_path)
            print(f"重命名: {filename} -> {new_name}")

# 使用示例
folder = r"D:\图标\SilkioSpace"  # Windows 路径
# folder = "/your/folder/path"    # Linux/Mac 路径
rename_files(folder)