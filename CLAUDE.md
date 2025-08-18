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
- **Square**: Primary payment processing with 5% commission structure
- **PayPal**: Secondary payment option (simulated)
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
npm run analyze          # Bundle analysis with vite-bundle-visualizer
```

**Backend Development:**

```bash
cd backend
npm run dev              # Start TypeScript backend with tsx watch
npm run dev:local        # Start with SQLite for local development
npm run build            # Compile TypeScript to dist/
npm run db:generate      # Generate Drizzle database schema
npm run db:migrate       # Run database migrations
npm run db:setup:local   # Setup local SQLite database
npm run db:seed:local    # Seed local database with test data
```

### Local Development Setup

**Quick Start for Local Development:**

```bash
# Setup local SQLite environment
cd backend
npm run db:setup:local   # Initialize SQLite database
npm run db:seed:local    # Seed with test data
npm run dev:local        # Start backend with SQLite

# In separate terminal - start frontend
npm run dev              # Start Vite dev server
```

**Running Tests:**

```bash
npm run test             # Run Vitest unit tests
npm run test:ui          # Interactive test UI
npm run test:coverage    # Generate coverage report (frontend)
npm run test:e2e         # Run Playwright E2E tests
npm run test:visual      # Run visual regression tests

# Backend testing
cd backend
npm run test             # Run backend Vitest tests
npm run test:coverage    # Backend test coverage
npm run test:sqlite      # Test SQLite functionality
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
- **Domain Layer**: Domain-driven design structure (`domain/`) with separated concerns for AI, bookings, and payments

### Backend Architecture (`backend/src/`)

- **Database Layer**: Drizzle ORM with schema definitions (`database/schema/`)
  - SQLite support for local development with dedicated schemas
  - PostgreSQL schemas for production deployment
  - Migration system with automated schema generation
- **API Routes**: Express.js with TypeScript (`routes/`)
  - Admin routes with role-based access
  - Payment processing with Square and PayPal integration
  - Hotel search and booking endpoints
  - AI-powered search routes
- **Services**: Business logic layer (`services/`)
  - `aiSearchService.ts` - OpenAI integration for natural language processing
  - `liteApiService.ts` - Hotel API integration for real hotel data
  - `squarePaymentService.ts` - Square payment processing (primary)
  - `paypalService.ts` - PayPal payment processing (secondary)
  - `cacheService.ts` - Redis caching for performance
  - `securityMonitoring.ts` - Security event monitoring
- **Middleware**: Security, validation, rate limiting (`middleware/`)
  - Raw body capture for Square webhooks
  - JWT authentication and authorization
  - Request validation with Zod schemas

### Data Flow Architecture

1. **Frontend** (React) → **Backend API** (TypeScript) → **External APIs** (LiteAPI/OpenAI/Square)
2. **Payment Flow**: Frontend → Square Web SDK → Backend webhook processing
3. **AI Search**: User input → OpenAI processing → LiteAPI hotel search → Results ranking
4. **Database**: SQLite (local) / PostgreSQL (production) with Drizzle ORM

## Environment Variables

### Modern Stack (Root `.env`)

```bash
VITE_API_URL=http://localhost:3001
VITE_OPENAI_API_KEY=<OpenAI API key>
VITE_LITEAPI_KEY=<LiteAPI key>
SQUARE_ACCESS_TOKEN=<Square access token>
SQUARE_APPLICATION_ID=<Square application ID>
SQUARE_ENVIRONMENT=sandbox
SQUARE_LOCATION_ID=<Square location ID>
```

### Backend (backend/.env)

```bash
# Database
DATABASE_URL=<PostgreSQL connection string>
LOCAL_SQLITE=true                    # Enable for local development

# External APIs
OPENAI_API_KEY=<OpenAI API key>
LITEAPI_KEY=<LiteAPI key>

# Payment Providers
SQUARE_ACCESS_TOKEN=<Square access token>
SQUARE_APPLICATION_ID=<Square application ID>
SQUARE_ENVIRONMENT=sandbox
SQUARE_LOCATION_ID=<Square location ID>
SQUARE_WEBHOOK_SIGNATURE_KEY=<Square webhook signature key>

# Security
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

### Build Process

```bash
# Frontend production build
npm run build               # TypeScript compilation + Vite build to dist/

# Backend production build  
cd backend && npm run build  # TypeScript compilation to dist/

# Preview production build
npm run preview             # Serve built frontend locally
```

### Performance Optimization

- Vite build optimization with manual chunk splitting (vendor, ui, forms)
- Bundle analysis with `npm run analyze` 
- Source maps enabled for debugging
- Tree shaking and code splitting configured
- Redis caching for API responses (backend)

### Security & Compliance

- **Helmet.js**: Security headers and CSRF protection
- **Rate Limiting**: API throttling and DDoS protection (`backend/src/middleware/rateLimiter.ts`)
- **Input Validation**: Zod schemas for all user inputs
- **Audit Logging**: Comprehensive audit trails (`backend/src/middleware/auditLogger.ts`)
- **GDPR Compliance**: Data handling utilities (`backend/src/utils/gdprCompliance.ts`)

## Payment System Architecture

### Square Integration (Primary)

- **Web SDK**: Frontend payment form with card tokenization
- **API Integration**: Backend payment processing with `squarePaymentService.ts`
- **Webhook Processing**: Real-time payment status updates at `/api/payments/webhook/square`
- **Idempotent Payments**: Prevents duplicate charges for the same booking
- **Commission Structure**: 5% commission on successful bookings

### PayPal Integration (Secondary)

- **Simulated Flow**: Order creation and capture simulation
- **Future Implementation**: Ready for real PayPal SDK integration
- **Fallback Option**: Alternative payment method for users

### Security & Compliance

- **PCI DSS**: Square handles sensitive card data
- **Webhook Verification**: HMAC signature validation for Square webhooks
- **Error Handling**: Comprehensive payment failure recovery

## Development Workflow

1. **Local Development**: Start with `npm run dev:local` in backend for SQLite setup
2. **Feature Development**: Use TypeScript strict mode, follow ESLint configuration
3. **Code Quality**: Run `npm run lint` and `npm run typecheck` before commits
4. **Testing Strategy**: Unit (Vitest) → Integration → E2E (Playwright)
5. **Payment Testing**: Use Square sandbox environment for payment flow testing
6. **Deployment**: Configure production Square credentials before deployment

## Important Development Notes

- **Database**: Use `LOCAL_SQLITE=true` for local development, PostgreSQL for production
- **Payment Testing**: Always use Square sandbox tokens in development
- **API Proxying**: Vite dev server proxies `/api` requests to backend on port 3001
- **Webhook Testing**: Use ngrok or similar for testing Square webhooks locally
- **Type Safety**: All API responses use TypeScript interfaces, maintain type contracts
- **Path Aliases**: Both frontend and backend use `@/` imports for src directories
- **Dual Database Support**: Backend has separate schemas for SQLite (`database/schema/sqlite/`) and PostgreSQL
- **Monorepo Ready**: TypeScript paths configured for shared packages (`@vibe/contracts`, `@vibe/ui`)

## Development Environment Setup

### First Time Setup

1. **Install Dependencies:**
   ```bash
   npm install          # Install frontend dependencies
   cd backend && npm install  # Install backend dependencies
   ```

2. **Setup Local Database:**
   ```bash
   cd backend
   npm run db:setup:local    # Initialize SQLite database
   npm run db:seed:local     # Seed with test data
   ```

3. **Start Development Servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev:local
   
   # Terminal 2 - Frontend
   npm run dev
   ```

### Environment Files Required

- Root `.env`: Frontend Vite variables (VITE_* prefix)
- `backend/.env`: Backend API keys and database config
- Both should never be committed to git

### Common Development Tasks

**Running Single Tests:**
```bash
# Frontend specific test
npm test SearchResults.test.tsx

# Backend specific test  
cd backend && npm test payments.test.ts

# E2E specific test
npm run test:e2e -- booking-flow.spec.ts
```

**Database Management:**
```bash
cd backend
npm run db:studio        # Open Drizzle Studio for data inspection
npm run db:generate      # Generate new migrations from schema changes
npm run db:push          # Push schema directly (development only)
```

**Bundle Analysis:**
```bash
npm run analyze          # Opens bundle visualizer in browser
```

**Clean Install:**
```bash
npm run clean:install    # Remove node_modules and reinstall
```
