# GitHub Actions Configuration Guide

## Workflow Overview

This project configures three GitHub Actions workflows to implement a complete local CI/CD pipeline:

### 1. `ci-cd.yml` - Main CI/CD Pipeline ⭐
**Trigger Conditions**: Push to `main` or `develop` branches, or create Pull Request

**Execution Flow**:
1. **Code Quality Check** - Code standards, type checking
2. **Test Stage** - Unit tests, integration tests
3. **Build Docker Images** - Local verification of all service images
4. **Security Scan** - Vulnerability scanning, security analysis
5. **Local Deployment Verification** - Verify Docker Compose configuration

### 2. `aws-deploy.yml` - AWS Production Deployment (Disabled) ⏸️
**Current Status**: Disabled, enable when AWS deployment is needed

**Enable Method**: Remove all `#` comment symbols from the beginning of the file

**Features**: 
- AWS authentication and ECR push
- ECS deployment and rollback mechanism
- Production environment automation deployment

### 3. `quick-test.yml` - Quick Test 🚀
**Trigger Conditions**: Any code push, supports manual trigger

**Execution Flow**:
1. **Syntax Check** - Frontend build, Python syntax
2. **Docker Test** - Verify Docker builds
3. **Quick Feedback** - Complete within 10 minutes

## Current Configuration Features

### ✅ Enabled Features
- 🔍 **Code Quality Check** - ESLint, TypeScript, Python syntax
- 🧪 **Automated Testing** - Frontend and AI service tests
- 🐳 **Docker Build Verification** - Local image build testing
- 🛡️ **Security Scanning** - Trivy vulnerability scanning
- ✅ **Configuration Verification** - Docker Compose configuration verification

### ⏸️ Disabled Features
- ☁️ **AWS Deployment** - Production environment auto-deployment
- 📦 **Image Push** - Push to container registry
- 🚀 **Cloud Service Integration** - AWS ECS, ECR, etc.

## Configuration Requirements

### Environment Variables Not Currently Needed
Since AWS deployment is disabled, these are not needed for now:
```
AWS_ACCESS_KEY_ID          # Not needed for now
AWS_SECRET_ACCESS_KEY      # Not needed for now
```

### Optional Environment Variables
```
AWS_REGION                 # Not needed for now
ECS_CLUSTER               # Not needed for now
ECS_SERVICE               # Not needed for now
```

## Usage Instructions

### 1. Push Code to Trigger
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

### 2. Manual Test Trigger
In the GitHub repository Actions page, select "Quick Test" workflow, click "Run workflow"

### 3. View Execution Results
- View workflow execution status in Actions page
- View security scan results in Security page
- Verify Docker build results locally

## Local Deployment

### Current Deployment Method
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### CI/CD Verification Results
GitHub Actions will verify:
- ✅ Code quality
- ✅ Tests passed
- ✅ Docker builds successful
- ✅ Security scan completed
- ✅ Configuration validity

## Enable AWS Deployment

### Step 1: Enable AWS Deployment Workflow
Edit `.github/workflows/aws-deploy.yml`, remove all `#` comment symbols

### Step 2: Configure AWS Credentials
In GitHub repository Settings → Secrets and variables → Actions, add:
```
AWS_ACCESS_KEY_ID          # AWS access key ID
AWS_SECRET_ACCESS_KEY      # AWS secret access key
```

### Step 3: Configure AWS Services
- Create ECS cluster and services
- Configure ECR image repository
- Set up task definition files

## Custom Configuration

### Modify Trigger Branches
Edit `.github/workflows/ci-cd.yml`:
```yaml
on:
  push:
    branches: [ main, develop, feature/* ]  # Add more branches
```

### Add New Services
Add new services to the build matrix:
```yaml
strategy:
  matrix:
    service: [frontend, ai-service, user, content, template, study, admin, gateway, new-service]
```

## Troubleshooting

### Common Issues

1. **Build Failure**: Check if Dockerfile is correct
2. **Test Failure**: Check test code and dependencies
3. **Configuration Error**: Check Docker Compose configuration
4. **Permission Issue**: Check GitHub Actions permissions

### Debug Methods

1. View Actions logs for detailed error information
2. Run the same commands locally to verify
3. Check Docker and Docker Compose configuration
4. Verify local environment dependencies

## Best Practices

1. **Branch Strategy**: Use `develop` branch for development, `main` branch for production
2. **Code Review**: Conduct code review through Pull Request
3. **Test Coverage**: Ensure new features have sufficient test coverage
4. **Security Scanning**: Regularly check security scan results
5. **Local Verification**: Verify all functions locally before deployment

## Extended Features

### Add Notifications
Integrate Slack, Teams and other notification services:
```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Add Performance Testing
Integrate Lighthouse, WebPageTest and other performance testing tools

### Add Automated Testing
Integrate Selenium, Playwright and other end-to-end testing tools

## Summary

Current configuration focuses on local CI/CD processes, ensuring code quality and build stability. When cloud deployment is needed, you can easily enable the AWS deployment workflow to achieve a complete cloud-based CI/CD pipeline.
