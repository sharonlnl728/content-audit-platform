# AI Content Moderation Platform

A content moderation platform built with Spring Cloud microservices and AI integration.

## 🚀 Quick Start

```bash
# Start infrastructure
docker-compose up -d audit-postgres audit-redis audit-consul

# Build services
mvn clean install -DskipTests

# Start AI service
cd ai-service
python main.py

# Start frontend
cd frontend
npm run dev
```

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Ant Design
- **Backend**: Spring Cloud microservices
- **AI**: OpenAI GPT integration
- **Database**: PostgreSQL + Redis
- **Deployment**: Docker + Docker Compose

## 📁 Project Structure

```
├── frontend/          # React app
├── ai-service/        # Python AI service  
├── user/             # User management
├── content/          # Content processing
├── admin/            # Admin management
├── template/         # Template management
├── study/            # Study management
├── gateway-service/  # API gateway
└── docker-compose.yml
```

## 🔧 Setup

1. Get OpenAI API key
2. Set environment variables in `.env`
3. Start services with Docker Compose

## 📄 License

Educational purposes only.