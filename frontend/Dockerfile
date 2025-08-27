# 使用nginx作为静态文件服务器
FROM nginx:alpine

# 设置时区为UTC (前端容器时区不重要，因为前端会智能转换)
ENV TZ=UTC
RUN apk add --no-cache tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# 复制构建后的文件到nginx目录
COPY dist/ /usr/share/nginx/html/

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露80端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"] 