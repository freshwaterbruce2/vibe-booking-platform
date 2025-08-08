# HotelFinder Deployment Guide

This guide covers deployment options for the HotelFinder hotel booking application, from development to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Production Build](#production-build)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Docker**: v20.0.0 or higher (for containerized deployment)
- **Git**: v2.30.0 or higher

### API Keys Required

1. **LiteAPI Keys**: Get from [LiteAPI Portal](https://www.liteapi.travel/)
   - Production API Key
   - Sandbox API Key

2. **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/)

3. **Google Analytics**: Get from [Google Analytics](https://analytics.google.com/) (optional)

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your actual values:

```bash
# LiteAPI Configuration
PROD_API_KEY=your_production_liteapi_key_here
SAND_API_KEY=your_sandbox_liteapi_key_here

# OpenAI Configuration
OPEN_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=production

# Security Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Analytics Configuration
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Environment-Specific Files

- `.env` - Development environment
- `.env.test` - Test environment (already configured)
- `.env.production` - Production environment

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm start
```

The application will be available at `http://localhost:3001`

### 3. Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Production Build

### 1. Build Optimized Assets

```bash
# Build CSS and JavaScript bundles
npm run build

# Optimize images
npm run optimize:images
```

### 2. Start Production Server

```bash
npm run start:prod
```

## Docker Deployment

### 1. Build Docker Image

```bash
# Build the image
docker build -t hotel-booking:latest .

# Or use npm script
npm run docker:build
```

### 2. Run with Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Environment Variables in Docker

Create a `.env` file in the project root with your production values:

```bash
NODE_ENV=production
PORT=3001
PROD_API_KEY=your_production_key
SAND_API_KEY=your_sandbox_key
OPEN_API_KEY=your_openai_key
ALLOWED_ORIGINS=https://yourdomain.com
```

## Cloud Deployment

### AWS Deployment

#### Using AWS App Runner

1. **Prepare the application**:
```bash
# Ensure your Dockerfile is optimized
# Make sure all environment variables are configured
```

2. **Create App Runner service**:
   - Connect to your GitHub repository
   - Set environment variables
   - Configure auto-scaling settings

#### Using AWS ECS

1. **Build and push to ECR**:
```bash
# Tag and push image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker tag hotel-booking:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/hotel-booking:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/hotel-booking:latest
```

2. **Create ECS service** with the pushed image

### Digital Ocean App Platform

1. **Connect repository** to DigitalOcean App Platform
2. **Configure build settings**:
   - Build command: `npm run build`
   - Run command: `npm run start:prod`
3. **Set environment variables** in the dashboard
4. **Deploy** the application

### Heroku Deployment

1. **Prepare for Heroku**:
```bash
# Add Procfile
echo "web: npm run start:prod" > Procfile

# Install Heroku CLI and login
heroku login
```

2. **Deploy**:
```bash
# Create Heroku app
heroku create your-hotel-booking-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PROD_API_KEY=your_key
heroku config:set SAND_API_KEY=your_sandbox_key
heroku config:set OPEN_API_KEY=your_openai_key

# Deploy
git push heroku main
```

## CI/CD Pipeline

The application includes a GitHub Actions workflow that:

1. **Runs tests** and linting on every push
2. **Performs security scanning** with Snyk
3. **Builds Docker images** and pushes to GitHub Container Registry
4. **Deploys to production** on main branch pushes

### Setting up GitHub Actions

1. **Add secrets** to your GitHub repository:
   - `SNYK_TOKEN` - For security scanning
   - API keys can be set as repository secrets for deployment

2. **Configure deployment** in `.github/workflows/ci.yml`

## Monitoring and Maintenance

### Health Checks

The application provides a health check endpoint:

```bash
# Check application health
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Logging

- Application logs are written to console
- Use centralized logging solutions like:
  - **AWS CloudWatch** (for AWS deployments)
  - **Google Cloud Logging** (for GCP deployments)
  - **ELK Stack** (for on-premise deployments)

### Performance Monitoring

1. **Enable Google Analytics** for user behavior tracking
2. **Set up APM tools** like New Relic or DataDog
3. **Monitor Docker metrics** if using containerized deployment

### Security Updates

1. **Regularly update dependencies**:
```bash
npm audit
npm update
```

2. **Scan for vulnerabilities**:
```bash
npm audit --audit-level high
```

3. **Update base Docker image** regularly

## Troubleshooting

### Common Issues

#### 1. API Key Issues

**Problem**: "OpenAI client not initialized" or "LiteAPI configuration error"

**Solution**:
- Verify environment variables are set correctly
- Check API key validity
- Ensure proper environment (sandbox/production) selection

#### 2. Docker Build Failures

**Problem**: Docker build fails during npm install

**Solution**:
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t hotel-booking:latest .
```

#### 3. Port Binding Issues

**Problem**: "Port 3001 already in use"

**Solution**:
```bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm start
```

#### 4. Environment Variable Issues

**Problem**: Environment variables not loading

**Solution**:
- Verify `.env` file exists and has correct format
- Check file permissions: `chmod 600 .env`
- Ensure no spaces around `=` in env vars

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug npm start
```

### Performance Issues

1. **Check resource usage**:
```bash
# Monitor CPU and memory
docker stats hotel-booking

# Check Node.js memory usage
node --inspect server/server.js
```

2. **Optimize assets**:
```bash
# Re-run optimization
npm run build
npm run optimize:images
```

## Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] API keys are valid and have proper permissions
- [ ] SSL/TLS certificates installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] CI/CD pipeline tested
- [ ] Performance benchmarks established
- [ ] Error handling tested
- [ ] Database migrations (if applicable)

## Support

For additional support:

1. Check application logs for error details
2. Review environment configuration
3. Verify API service status
4. Check network connectivity
5. Review security and firewall settings

## Version History

- **v1.0.0** - Initial production release with full PWA support
- Enhanced security, performance optimizations, and comprehensive testing