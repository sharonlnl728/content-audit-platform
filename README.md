# Content Audit Platform

An intelligent content moderation platform that uses AI to automatically review and filter content based on customizable rules and templates.

## Demo

🚀 **Live Demo**: [Coming Soon - AWS Deployment]

*Access the platform dashboard and explore features*

## What It Does

This platform helps businesses and content creators automatically moderate text and images by:
- **AI-Powered Analysis**: Uses OpenAI GPT to understand content context
- **Template-Based Rules**: Pre-built templates for e-commerce, social media, and custom use cases
- **Batch Processing**: Handle large volumes of content efficiently
- **Golden Set Testing**: Validate and improve AI accuracy with test datasets

## Use Cases

- **E-commerce**: Review product descriptions, marketing copy, and user reviews
- **Social Media**: Moderate user-generated content and comments
- **Marketing**: Ensure landing pages and ads comply with guidelines
- **Advertising**: Review ad copy, creative assets, landing page ads, banner ads, and campaign materials for compliance
- **Content Creation**: Filter and validate creative content before publication

## Quick Start

```bash
# Start services
docker-compose up -d audit-postgres audit-redis audit-consul

# Build and run
mvn clean install
cd frontend && npm run dev
```

## Tech Stack

- **Frontend**: React + TypeScript + Ant Design + Vite
- **Backend**: Spring Cloud microservices
- **AI**: OpenAI GPT integration
- **Database**: PostgreSQL + Redis
- **Deployment**: Docker

## Project Structure

```
├── frontend/          # React UI
├── ai-service/        # AI processing
├── content/           # Content management
├── template/          # Rule templates
├── study/             # Audit studies
├── user/              # User management
├── admin/             # Admin management
└── gateway-service/   # API gateway
```

## Setup

1. Add your OpenAI API key to `.env`
2. Start with Docker Compose
3. Access the dashboard at `http://localhost:3000`

## Features

- **Real-time Dashboard**: Monitor content processing and AI performance
- **Template Management**: Create and customize moderation rules
- **Study Management**: Organize content audits into studies
- **User Management**: Role-based access control
- **Performance Analytics**: Track AI accuracy and improvement over time