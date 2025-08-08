# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern hotel booking platform with a dual architecture: a React/TypeScript frontend with comprehensive backend services, plus a legacy vanilla JavaScript implementation. The application features AI-powered search, passion-based hotel matching, and enterprise-grade deployment capabilities.

## Architecture

This project has a **dual architecture** with separate modern and legacy implementations:

### Modern Stack (Primary)

- **Frontend**: React 18 + TypeScript + Vite (`src/`)
- **Backend**: Express.js + TypeScript (`backend/`)
- **Database**: Drizzle ORM with PostgreSQL support
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS + Framer Motion

### Legacy Stack (Integration)

- **Location**: `build-website-example/`
- **Frontend**: Vanilla JavaScript (`client/`)
- **Backend**: Node.js/Express (`server/server.js`)
- **Purpose**: Existing API integration and fallback

### Core Services

- **LiteAPI**: Hotel search, rates, booking, payments
- **OpenAI**: Natural language query processing
- **Stripe**: Payment processing (modern stack)
- **AI Services**: Custom AI search service (`src/services/aiService.ts`)

### Key Features

- AI-powered natural language hotel search
- 7-category passion-based hotel matching system
- Multi-step booking flow with payment integration
- Enterprise-grade monitoring and observability
- Progressive Web App (PWA) capabilities
- Docker containerization and Kubernetes deployment

## Common Development Commands

### Modern Stack Development (Root Directory)

**Development:**

```bash
npm run dev              # Start Vite dev server (port 3000)
npm run build            # Build TypeScript + Vite for production
npm run preview          # Preview production build
```

**Testing:**

```bash
npm test                 # Run Vitest unit tests
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright E2E tests
npm run test:visual      # Run visual regression tests
```

**Code Quality:**

```bash
npm run lint             # ESLint analysis
npm run lint:fix         # Auto-fix ESLint issues
npm run typecheck        # TypeScript type checking
npm run format           # Prettier formatting
npm run check:all        # Run all quality checks
```

**Backend Development:**

```bash
cd backend
npm run dev              # Start TypeScript backend with tsx watch
npm run build            # Compile TypeScript to dist/
npm run db:generate      # Generate Drizzle database schema
npm run db:migrate       # Run database migrations
```

### Legacy Stack Development (build-website-example/)

**Development:**

```bash
cd build-website-example
npm start                # Start server with nodemon (port 3001)
npm run build            # Build and optimize assets
```

**Testing:**

```bash
npm run test             # Jest unit tests
npm run test:e2e         # Playwright E2E tests
npm run test:all         # Complete test suite
npm run validate:production # Full production validation
```

## Code Architecture Details

### Modern Frontend Architecture (`src/`)

- **Component Structure**: Organized by feature (booking, hotels, search, payment)
- **State Management**: Zustand stores with TypeScript (`store/`)
  - `hotelStore.ts` - Hotel data and search results
  - `bookingStore.ts` - Booking flow state
  - `searchStore.ts` - Search filters and preferences
  - `userStore.ts` - User authentication and preferences
- **Routing**: React Router v6 with lazy loading
- **API Layer**: Axios-based services with TypeScript interfaces (`services/`)

### Backend Architecture (`backend/src/`)

- **Database Layer**: Drizzle ORM with schema definitions (`database/schema/`)
- **API Routes**: Express.js with TypeScript (`routes/`)
  - Admin routes with role-based access
  - Payment processing with Stripe integration
  - Hotel search and booking endpoints
- **Services**: Business logic layer (`services/`)
  - `aiSearchService.ts` - OpenAI integration
  - `liteApiService.ts` - Hotel API integration
  - `paymentService.ts` - Stripe payment processing
- **Middleware**: Security, validation, rate limiting (`middleware/`)

### Legacy Integration (`build-website-example/`)

- **Vanilla JS Client**: Modular design with passion system
- **Express Server**: Direct LiteAPI integration (`server/server.js`)
- **Passion Matching**: 7-category scoring algorithm (`client/passion-data.js`)
- **Payment Flow**: LiteAPI Payment SDK integration

### Data Flow Architecture

1. **Frontend** (React) → **Backend API** (TypeScript) → **External APIs** (LiteAPI/OpenAI)
2. **Legacy Frontend** (Vanilla JS) → **Legacy Server** → **External APIs**
3. **Shared Services**: Payment processing, hotel data, user management

## Environment Variables

### Modern Stack (Root `.env`)

```bash
VITE_API_URL=http://localhost:3001
VITE_OPENAI_API_KEY=<OpenAI API key>
VITE_LITEAPI_KEY=<LiteAPI key>
VITE_STRIPE_PUBLISHABLE_KEY=<Stripe public key>
```

### Backend (backend/.env)

```bash
DATABASE_URL=<PostgreSQL connection string>
OPENAI_API_KEY=<OpenAI API key>
LITEAPI_KEY=<LiteAPI key>
STRIPE_SECRET_KEY=<Stripe secret key>
JWT_SECRET=<JWT signing secret>
REDIS_URL=<Redis connection for caching>
```

### Legacy Stack (build-website-example/.env)

```bash
PROD_API_KEY=<LiteAPI production key>
SAND_API_KEY=<LiteAPI sandbox key>
OPEN_API_KEY=<OpenAI API key>
PORT=3001
```

## Key Technical Patterns

### AI-Powered Search Architecture

The application uses a dual AI approach:

1. **OpenAI Integration**: Natural language parsing in `aiSearchService.ts`
2. **Passion-Based Matching**: 7-category algorithmic scoring system
3. **Hybrid Results**: Combines AI search with passion preferences

### Type-Safe Development

- **Frontend**: TypeScript interfaces for all API responses (`types/`)
- **Backend**: Drizzle ORM with type-safe database operations
- **Validation**: Zod schemas for runtime type validation
- **API Contracts**: Shared TypeScript definitions

### State Management Patterns

- **Modern**: Zustand stores with TypeScript and persistence
- **Legacy**: Vanilla JavaScript with localStorage
- **Data Flow**: Unidirectional data flow with clear separation of concerns

### Error Handling & Resilience

- Circuit breaker pattern for external API calls
- Graceful degradation with fallback responses
- Comprehensive error boundaries in React
- Structured logging with Winston

## Production & Deployment

### Docker Containerization

```bash
npm run docker:build        # Build Docker image
npm run docker:run          # Run containerized app
npm run docker:compose      # Full stack with dependencies
```

### Kubernetes Deployment

- **Location**: `deployment/kubernetes/`
- **Features**: Blue-green deployment, canary releases, auto-scaling
- **Monitoring**: Prometheus, Grafana dashboards
- **Security**: Network policies, RBAC, secrets management

### Performance Optimization

- Vite build optimization with code splitting
- Bundle analysis with `npm run bundle:analyze`
- Image optimization and CDN integration
- Redis caching for API responses

### Security & Compliance

- **ESLint Security Plugin**: Automated security scanning
- **Helmet.js**: Security headers and CSRF protection
- **Rate Limiting**: API throttling and DDoS protection
- **Input Validation**: Zod schemas for all user inputs
- **Dependency Scanning**: Snyk integration for vulnerability detection

## AI & DevOps Integration

### AI-Powered Development (`ai-devops/`)

- **Performance Optimizer**: Automatic performance tuning
- **Security Assistant**: Intelligent security monitoring
- **Deployment Predictor**: ML-based deployment success prediction
- **Resource Optimizer**: Intelligent resource allocation
- **Canary Analysis**: AI-driven canary deployment decisions

### Agent Training System (`agent-training/`)

- Implementation examples and patterns
- Dependency management guides
- Testing templates and best practices
- Payment integration templates

## Development Workflow

1. **Feature Development**: Use TypeScript for type safety
2. **Code Quality**: Run `npm run check:all` before commits
3. **Testing Strategy**: Unit (Vitest) → Integration → E2E (Playwright)
4. **Security**: Run security scans before deployment
5. **Performance**: Monitor bundle size and runtime metrics
6. **Deployment**: Use Kubernetes with monitoring and rollback capabilities
