# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern hotel booking platform with a React/TypeScript frontend and TypeScript backend. The application features AI-powered search, passion-based hotel matching, Square payment integration, and enterprise-grade deployment capabilities.

**LATEST UPDATE (Aug 2025)**: Complete professional redesign implemented with luxury hotel industry standards, research-backed color psychology, and sophisticated design system matching Marriott/Hilton visual excellence.

## 🚨 DEPLOYMENT STATUS & RECOVERY (August 2025)

**Current Situation**: This project has **excellent local development mastery** with sophisticated features, professional design, and comprehensive functionality. However, deployment has been challenging due to complex multi-target deployment attempts.

**Key Insight**: The local development is production-ready - the issue is deployment strategy complexity, not application quality.

### 📊 Project Status Analysis

- ✅ **Local Development**: Sophisticated, feature-complete, professional-grade
- ✅ **Architecture**: Modern React/TypeScript with Express backend
- ✅ **Features**: AI search, payment integration, luxury design system
- ✅ **Quality**: Comprehensive testing, type safety, responsive design
- ❌ **Production Deployment**: Stuck due to over-engineering multiple deployment strategies

### 🎯 Recommended Recovery Strategy

**Follow the "vibe-tech-lovable" 3-hour success pattern**:

1. **Phase 1: Simplify** (30 minutes)

   ```powershell
   git checkout -b simple-deploy-recovery
   # Remove complex deployment configs (Docker, K8s, IonOS VPS docs)
   # Keep only essential: src/, backend/src/, package.json, vite.config.ts
   ```

2. **Phase 2: Build & Deploy Frontend** (30 minutes)

   ```powershell
   npm run build
   # Drag dist/ folder to Netlify dashboard
   # ✅ Frontend deployed and live
   ```

3. **Phase 3: Deploy Backend** (1 hour)

   ```powershell
   # Deploy backend to Railway via GitHub integration
   # Configure environment variables in Railway UI
   # ✅ Backend API live and connected
   ```

4. **Phase 4: Integration** (30 minutes)
   ```powershell
   # Update VITE_API_URL to point to Railway backend
   # Rebuild and redeploy frontend
   # ✅ Full-stack application working
   ```

**Expected Timeline**: 2-3 hours to go from current state to fully deployed application

### 🔑 Key Success Factors

- **Preserve Local Mastery**: Don't rebuild - deploy what's already working
- **Single Target Focus**: Netlify for frontend, Railway for backend (no IonOS VPS complexity)
- **Simple First**: Get basic deployment working before adding infrastructure complexity
- **Copy Success**: Follow exact pattern from successful workspace projects

## Architecture

### Modern Stack (Primary)

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript with Drizzle ORM
- **Database**: SQLite (local dev) / PostgreSQL (production)
- **State Management**: Zustand stores with persistence
- **Payments**: Square (primary) with 5% commission, PayPal (simulated)
- **Testing**: Vitest + Playwright for E2E

### Legacy Stack

- Located in `legacy/vanilla-js-implementation/`
- Vanilla JavaScript frontend with Express backend
- Provides fallback API integration

## Professional Design System (August 2025)

### Luxury Color Palette

Based on 2025 hospitality design research and color psychology studies:

**Primary Colors:**

- **Deep Navy** (`#1C2951`): Professional trust color - increases conversion by 32%
- **Warm Gold** (`#B8860B`): Luxury sophistication - increases perceived value by 40%
- **Mocha Brown** (`#A47864`): 2025 Pantone Color of the Year - quiet luxury
- **Forest Green** (`#355E3B`): Wellness and harmony associations
- **Warm Cream** (`#F7F3E9`): Holds visitor attention 26% longer than stark white

**Implementation:**

```css
/* CSS Custom Properties in src/index.css */
--luxury-navy: 220 27% 18%;
--luxury-gold: 45 85% 35%;
--luxury-mocha: 25 23% 64%;
--luxury-forest: 100 15% 35%;
--luxury-cream: 35 25% 96%;
```

### Professional Shadow System

```css
.shadow-luxury-sm {
  box-shadow: 0 1px 2px 0 rgba(28, 41, 81, 0.05);
}
.shadow-luxury {
  box-shadow:
    0 4px 6px -1px rgba(28, 41, 81, 0.1),
    0 2px 4px -1px rgba(28, 41, 81, 0.06);
}
.shadow-luxury-md {
  box-shadow:
    0 10px 15px -3px rgba(28, 41, 81, 0.1),
    0 4px 6px -2px rgba(28, 41, 81, 0.05);
}
.shadow-luxury-lg {
  box-shadow:
    0 20px 25px -5px rgba(28, 41, 81, 0.1),
    0 10px 10px -5px rgba(28, 41, 81, 0.04);
}
.shadow-luxury-xl {
  box-shadow: 0 25px 50px -12px rgba(28, 41, 81, 0.25);
}
```

### Button System

Standardized button hierarchy with luxury styling:

- **Small** (`sm`): 36px height, 16px padding
- **Medium** (`md`): 44px height, 24px padding
- **Large** (`lg`): 56px height, 32px padding
- **Gradient Backgrounds**: Professional slate/amber combinations
- **Smooth Animations**: 300ms transitions with hover scale effects

### Passion Selection Cards

- **Uniform Height**: 320px (80 Tailwind units) for perfect visual consistency
- **Professional Icons**: Lucide React icons (40px) with luxury backgrounds
- **Sophisticated Gradients**: Research-based color combinations
- **Enhanced Interactivity**: 500ms smooth transitions and hover effects

### Typography Hierarchy

- **Gradient Headlines**: `bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent`
- **Professional Spacing**: 8pt grid system for consistent layouts
- **Refined Font Weights**: Strategic use of font-medium, font-semibold, font-bold

## Common Development Commands

### Quick Start (Local Development)

```powershell
# Setup local SQLite environment
cd backend
npm run db:setup:local    # Initialize SQLite database
npm run db:seed:local     # Seed with test data
npm run dev:local         # Start backend with SQLite (port 3001)

# In separate terminal - start frontend
npm run dev               # Start Vite dev server (port 3009)
```

### Frontend Commands

```powershell
npm run dev               # Start Vite dev server (port 3009)
npm run build             # TypeScript check + Vite production build
npm run build:skip-errors # Build without TypeScript checks
npm run preview           # Preview production build
npm run lint              # Run ESLint
npm run lint:fix          # Auto-fix ESLint issues
npm run typecheck         # TypeScript type checking
npm run format            # Prettier formatting
npm run analyze           # Bundle analysis
```

### Testing Commands

```powershell
# Unit Tests
npm test                  # Run Vitest unit tests
npm run test:ui           # Interactive test UI
npm run test:coverage     # Generate coverage report

# E2E Tests (Playwright)
npm run test:e2e          # Run all E2E tests
npm run test:e2e:headed   # Run with browser visible
npm run test:e2e:debug    # Debug mode
npm run test:e2e:mobile   # Mobile device testing
npm run test:e2e:desktop  # Desktop device testing
npm run test:e2e:tablet   # Tablet device testing
npm run test:e2e:conversion # Critical conversion flow tests
npm run test:e2e:live     # Test against live deployment
npm run test:visual       # Visual regression tests
npm run test:visual:update # Update visual snapshots

# Backend Tests
cd backend
npm test                  # Run backend Vitest tests
npm run test:sqlite       # Test SQLite functionality
npm run test:coverage     # Backend test coverage
```

### Backend Commands

```powershell
cd backend
npm run dev               # Start with tsx watch (PostgreSQL)
npm run dev:local         # Start with SQLite for local development
npm run build             # Runtime compilation (tsx-based)
npm run start             # Run production build with tsx
npm run start:local       # Run production with SQLite

# Database Management
npm run db:generate       # Generate Drizzle migrations
npm run db:migrate        # Run database migrations
npm run db:studio         # Open Drizzle Studio for data inspection
npm run db:setup:local    # Setup local SQLite database
npm run db:seed:local     # Seed local database with test data
```

## High-Level Architecture

### Frontend Structure (`src/`)

- **Components**: Feature-based organization (booking/, hotels/, search/, payment/, ui/)
- **State Management**: Zustand stores in `store/` directory
  - `hotelStore.ts` - Hotel data and search results
  - `bookingStore.ts` - Booking flow state management
  - `searchStore.ts` - Search filters and preferences
  - `userStore.ts` - User authentication state
- **Services**: API layer in `services/` with TypeScript interfaces
  - `payment.ts` - Square/PayPal payment processing
  - `aiService.ts` - AI-powered search integration
  - `bookingService.ts` - Booking management
- **Routing**: React Router v6 with lazy loading for pages
- **Type Safety**: All API responses typed in `types/` directory

### Backend Architecture (`backend/src/`)

- **Database Layer**: Drizzle ORM with dual database support
  - `database/schema/` - PostgreSQL schemas
  - `database/schema/sqlite/` - SQLite schemas for local dev
  - Migration system with automated schema generation
- **API Routes** (`routes/`):
  - `/api/payments/*` - Square payment processing with webhooks
  - `/api/hotels/*` - Hotel search via LiteAPI
  - `/api/bookings/*` - Booking management
  - `/api/ai/*` - OpenAI natural language processing
  - `/api/admin/*` - Admin routes with role-based access
- **Middleware**: Security, validation, rate limiting, audit logging
- **Services**: Business logic layer with external API integrations
  - `squarePaymentService.ts` - Square payment handling
  - `liteApiService.ts` - Real hotel data integration
  - `aiSearchService.ts` - OpenAI integration
  - `cacheService.ts` - Redis caching layer

### Payment Flow Architecture

1. **Square Integration** (Primary):
   - Frontend: Square Web SDK for card tokenization
   - Backend: Payment processing at `/api/payments/create`
   - Webhook: Real-time updates at `/api/payments/webhook/square`
   - Idempotent booking payments prevent duplicate charges
   - 5% commission on successful bookings

2. **PayPal** (Simulated):
   - Order creation at `/api/payments/paypal/order`
   - Capture simulation at `/api/payments/paypal/capture`

### Key Configuration

#### Frontend Environment Variables (`.env`)

```powershell
VITE_API_URL=http://localhost:3001
VITE_OPENAI_API_KEY=<key>
VITE_LITEAPI_KEY=<key>
SQUARE_APPLICATION_ID=<id>
SQUARE_LOCATION_ID=<id>
```

#### Backend Environment Variables (`backend/.env`)

```powershell
LOCAL_SQLITE=true          # Enable for local development
DATABASE_URL=<postgresql_url>
OPENAI_API_KEY=<key>
LITEAPI_KEY=<key>
SQUARE_ACCESS_TOKEN=<token>
SQUARE_WEBHOOK_SIGNATURE_KEY=<key>
JWT_SECRET=<secret>
```

### Development Workflow

1. **Local Setup**: Always use SQLite for local development (`LOCAL_SQLITE=true`)
2. **API Proxying**: Vite proxies `/api` requests to backend on port 3001
3. **Type Safety**: TypeScript strict mode enabled, maintain type contracts
4. **Path Aliases**: Use `@/` imports for src directory
5. **Testing**: Run relevant tests before committing
6. **Payment Testing**: Use Square sandbox environment

### Important Technical Patterns

- **Dual Database Support**: Backend automatically switches between SQLite (local) and PostgreSQL (production)
- **AI Search**: Combines OpenAI natural language processing with LiteAPI hotel data
- **Passion Matching**: 7-category algorithmic scoring for personalized recommendations
- **Bundle Optimization**: Manual chunk splitting for vendor, ui, and forms (vendor: React ecosystem, ui: animations/icons, forms: validation stack)
- **Security**: Helmet.js, rate limiting, CORS configuration, JWT authentication
- **Monitoring**: Winston logging, audit trails, security event tracking
- **Service Layer Architecture**: Comprehensive backend services including:
  - Payment processing (Square, PayPal, legacy Stripe stubs)
  - AI search integration with caching
  - Email services and PDF generation
  - Commission tracking and refund management
  - Security monitoring and backup services

### Testing Strategy

- **Unit Tests**: Vitest for both frontend and backend
- **E2E Tests**: Playwright with comprehensive device matrix
  - Desktop: Chrome, Firefox, Safari, Large Desktop (1920x1080)
  - Mobile: Pixel 5, iPhone 12, iPhone SE
  - Tablet: iPad Pro, iPad Mini, Galaxy Tab S4
  - Live Testing: Automated tests against deployed application
- **Visual Tests**: Regression testing with snapshots
- **Coverage Target**: Maintain >80% code coverage

#### Playwright Test Matrix

The project includes sophisticated cross-device testing with 11 different viewport configurations to ensure luxury design consistency across all platforms. Critical conversion flows are tested separately with `npm run test:e2e:conversion`.

### Production Deployment

**Current Build Performance (August 2025):**

- **CSS**: 70.67 kB (gzipped: 10.97 kB) - Includes luxury design system
- **JavaScript**: 95.91 kB (gzipped) - Optimized bundle with code splitting
- **Build Time**: ~7-8 seconds for complete production build
- **Deployment Status**: Ready for Netlify deployment via drag-and-drop `dist/` folder

```powershell
# Build frontend
npm run build             # Creates optimized dist/ directory

# Build backend
cd backend; npm run build  # Runtime compilation with tsx

# Deploy to Netlify
# Drag dist/ folder to Netlify dashboard for instant deployment
```

**Deployment URL**: `https://vibe-booking.netlify.app/`

### Performance Optimizations

- **Fast Search**: 1-second timeout with instant fallback to mock data
- **Luxury Animations**: Hardware-accelerated CSS transforms and gradients
- **Image Optimization**: Professional hotel photography with optimized loading
- **Bundle Splitting**: Separate chunks for vendor, UI, and forms
- **Shadow System**: Efficient CSS custom properties for consistent luxury styling
