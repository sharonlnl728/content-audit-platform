#!/bin/bash

# 项目备份脚本
BACKUP_DIR="../content-audit-platform-backup-$(date +%Y%m%d-%H%M%S)"
PROJECT_DIR="."

echo "=== 开始备份项目 ==="
echo "备份目录: $BACKUP_DIR"
echo "项目目录: $PROJECT_DIR"
echo ""

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份源代码和配置文件
echo "1. 备份源代码和配置文件..."
rsync -av --exclude='node_modules' \
         --exclude='target' \
         --exclude='.git' \
         --exclude='*.log' \
         --exclude='*.tmp' \
         --exclude='.DS_Store' \
         --exclude='.idea' \
         --exclude='.vscode' \
         "$PROJECT_DIR/" "$BACKUP_DIR/"

# 备份Docker相关文件
echo ""
echo "2. 备份Docker相关文件..."
cp docker-compose.yml "$BACKUP_DIR/"
cp .env* "$BACKUP_DIR/" 2>/dev/null || echo "没有.env文件"

# 备份数据库（如果可能）
echo ""
echo "3. 备份数据库..."
docker exec audit-postgres pg_dump -U admin content_audit > "$BACKUP_DIR/content_audit_backup.sql" 2>/dev/null && echo "数据库备份完成" || echo "数据库备份跳过"

# 创建备份信息文件
echo ""
echo "4. 创建备份信息..."
cat > "$BACKUP_DIR/backup-info.txt" << EOF
项目备份信息
============
备份时间: $(date)
备份目录: $BACKUP_DIR
项目名称: Content Audit Platform

当前运行的服务状态:
$(docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}")

Docker版本: $(docker --version)
Docker Compose版本: $(docker-compose --version)

系统信息:
$(uname -a)

备份内容:
- 源代码和配置文件
- Docker配置文件
- 数据库备份
- 项目文档

恢复说明:
1. 复制备份目录到目标位置
2. 运行 docker-compose up -d 启动服务
3. 恢复数据库: docker exec -i audit-postgres psql -U admin content_audit < content_audit_backup.sql
EOF

echo "备份信息文件创建完成"

# 显示备份结果
echo ""
echo "=== 备份完成 ==="
echo "备份目录: $BACKUP_DIR"
echo "备份大小: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo ""
echo "备份内容:"
ls -la "$BACKUP_DIR"
echo ""
echo "备份信息:"
cat "$BACKUP_DIR/backup-info.txt"
