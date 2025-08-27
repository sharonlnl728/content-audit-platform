FROM maven:3.8.4-openjdk-17 AS builder

WORKDIR /app
COPY pom.xml .
COPY src ./src

# 编译Java代码
RUN mvn clean package -DskipTests

# 运行阶段
FROM openjdk:17-slim

WORKDIR /app

# 安装必要的工具和时区数据
RUN apt-get update && apt-get install -y netcat-openbsd postgresql-client curl tzdata && rm -rf /var/lib/apt/lists/*

# 设置时区为UTC
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 复制启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 从构建阶段复制JAR文件
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8084

# 使用启动脚本
ENTRYPOINT ["/start.sh"]
