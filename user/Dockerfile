# 构建阶段
FROM maven:3.8.4-openjdk-17 AS builder

WORKDIR /app
COPY pom.xml .
COPY src ./src

# 编译Java代码
RUN mvn clean package -DskipTests

# 运行阶段
FROM openjdk:17-slim

# 设置时区为UTC
ENV TZ=UTC
RUN apt-get update && apt-get install -y tzdata netcat-openbsd postgresql-client curl && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 从构建阶段复制JAR文件
COPY --from=builder /app/target/*.jar app.jar

# 复制配置文件
COPY src/main/resources/application-docker.yml /app/application-docker.yml

# 安装必要的工具
RUN apt-get update && apt-get install -y netcat-openbsd postgresql-client curl && rm -rf /var/lib/apt/lists/*

# 复制启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8081

# 使用新的启动脚本
ENTRYPOINT ["/start.sh"] 