# Vibe Booking Platform - GitHub Copilot Instructions

**ALWAYS follow these instructions first and fallback to additional search and context gathering only if the information here is incomplete or found to be in error.**

Vibe Booking is a modern luxury hotel booking platform with React 18 + TypeScript frontend and Express.js backend. Features AI-powered search, Square payments, and professional design system.

## Bootstrap & Setup Commands

### Initial Setup (Fresh Clone)
```bash
# Install all dependencies (NEVER CANCEL - takes ~30 seconds)
npm install
cd backend && PUPPETEER_SKIP_DOWNLOAD=true npm install
cd ..

# Install additional testing dependencies
npm install jsdom @testing-library/jest-dom @testing-library/react jest-axe @playwright/test --save-dev

# Install Playwright browsers (NEVER CANCEL - takes 3-5 minutes)
npx playwright install
```

### Database Setup (Local Development)
```bash
# Setup local SQLite database
cd backend
npm run db:setup:local    # Takes ~1 second
npm run db:seed:local     # Seed with test data
cd ..
```

## Development Commands

### Start Development Servers
```bash
# Start frontend dev server (port 3009)
npm run dev               # Ready in ~1 second

# Start backend server (in separate terminal)
cd backend
npm run dev:local         # Uses SQLite, starts on port 3001
```

### Build Commands
```bash
# Frontend build (NEVER CANCEL - takes 10-15 seconds, timeout: 30+ minutes)
npm run build             # TypeScript check + Vite production build
                          # Produces optimized dist/ folder

# Backend build (NEVER CANCEL - takes 8-12 seconds, timeout: 30+ minutes)  
cd backend
npm run build             # Note: Has TypeScript errors but completes
```

### Linting & Type Checking
```bash
# Frontend linting (NEVER CANCEL - takes 15-20 seconds, timeout: 10+ minutes)
npx eslint src            # Use this instead of npm run lint (ESLint v9 migration)

# Type checking (takes ~6 seconds)
npm run typecheck         # Always passes

# Backend type checking (takes ~10 seconds)
cd backend
npm run typecheck
```

### Testing Commands

#### Unit Tests (NEVER CANCEL - takes 10-15 seconds, timeout: 30+ minutes)
```bash
# Frontend unit tests
npm test -- --run        # Some tests fail (expected), runs 136 tests

# Backend unit tests  
cd backend
npm test -- --run        # Has setup issues with window object
```

#### E2E Tests (NEVER CANCEL - takes 2-5 minutes, timeout: 60+ minutes)
```bash
# Full E2E test suite
npm run test:e2e          # Comprehensive Playwright tests across devices

# Specific E2E tests
npm run test:e2e -- booking-flow.spec.ts
npm run test:e2e:headed   # With browser visible
npm run test:e2e:debug    # Debug mode

# Visual regression tests
npm run test:visual       # Screenshot comparisons
```

## Manual Validation Scenarios

**ALWAYS test these scenarios after making changes:**

### 1. Basic Application Functionality
```bash
# Start dev server
npm run dev

# Visit http://localhost:3009/ and verify:
# - Homepage loads with luxury design
# - Search bar is functional  
# - Hotel cards display properly
# - Navigation works between pages
```

### 2. Complete User Journey Testing
```bash
# After starting dev server, test this flow:
# 1. Open http://localhost:3009/
# 2. Click passion selection (Adventure, Luxury, etc.)
# 3. Enter search: "Tokyo" in search bar
# 4. Click "Search Hotels" button
# 5. Verify search results load (mock data)
# 6. Click on a hotel card
# 7. Navigate through booking flow
# 8. Test payment form (demo mode)
```

### 3. Build Validation
```bash
# Build and preview production version
npm run build            # Must complete successfully
npm run preview          # Test production build locally
# Visit http://localhost:4173/ and repeat user journey
```

### 4. Cross-Device Testing
```bash
# E2E tests cover these automatically:
npm run test:e2e         # Tests iPhone, iPad, Desktop viewports
```

## Critical Build & Test Timing

**Command execution times (set timeouts accordingly):**

- **npm install**: 20-30 seconds (timeout: 10+ minutes)
- **Backend npm install**: 15-20 seconds with PUPPETEER_SKIP_DOWNLOAD (timeout: 10+ minutes) 
- **npx playwright install**: 3-5 minutes (timeout: 30+ minutes)
- **npm run build**: 10-15 seconds (timeout: 30+ minutes)
- **npm run typecheck**: 6 seconds (timeout: 10+ minutes)
- **npm test -- --run**: 10-15 seconds (timeout: 30+ minutes)
- **npm run test:e2e**: 2-5 minutes (timeout: 60+ minutes)

**NEVER CANCEL these commands - builds may take longer in CI environments.**

## Known Issues & Workarounds

### Linting Issues
```bash
# ESLint migration in progress - use direct command:
npx eslint src            # Instead of npm run lint
npx eslint backend/src    # For backend linting
```

### Testing Dependencies
```bash
# Missing test dependencies - install as needed:
npm install jsdom @testing-library/jest-dom @testing-library/react jest-axe --save-dev
```

### Backend Database Issues
```bash
# Use SQLite for local development:
cd backend
export LOCAL_SQLITE=true  # or set LOCAL_SQLITE=true && npm run dev:local
npm run db:setup:local
```

### Playwright Browser Installation
```bash
# If browser download fails:
npx playwright install --force
# Or skip download initially:
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

## Project Structure

### Key Frontend Directories
- `src/components/` - Feature-based components (booking/, hotels/, search/, payment/, ui/)
- `src/pages/` - Route components with lazy loading
- `src/store/` - Zustand stores (hotelStore, bookingStore, searchStore, userStore)
- `src/services/` - API layer with TypeScript interfaces
- `src/__tests__/` - Unit tests with Vitest + React Testing Library
- `tests/e2e/` - Playwright E2E tests

### Key Backend Directories  
- `backend/src/routes/` - API endpoints (/api/payments, /api/hotels, /api/bookings, /api/ai)
- `backend/src/services/` - Business logic (squarePaymentService, liteApiService, aiSearchService)
- `backend/src/database/` - Drizzle ORM with dual database support
- `backend/src/middleware/` - Security, validation, audit logging

### Configuration Files
- `vite.config.ts` - Frontend build configuration with proxy to backend:3001
- `playwright.config.ts` - E2E test configuration with device matrix
- `vitest.config.ts` - Unit test configuration with jsdom
- `tsconfig.json` - TypeScript configuration with strict mode

## Environment Setup

### Frontend Environment Variables (.env)
```bash
VITE_API_URL=http://localhost:3001    # Backend API URL
VITE_OPENAI_API_KEY=your_key_here     # AI search functionality
```

### Backend Environment Variables (backend/.env)
```bash
LOCAL_SQLITE=true                     # Enable SQLite for local dev
DATABASE_URL=sqlite:./database/vibe-booking.db
SQUARE_ACCESS_TOKEN=sandbox_token     # Payment processing
```

## Pre-Commit Validation

**Always run these commands before committing:**

```bash
# 1. Type checking (required to pass)
npm run typecheck         # Must pass
cd backend && npm run typecheck

# 2. Build verification (required to pass)  
npm run build            # Must complete successfully

# 3. Core functionality test
npm run dev              # Start server, manually test basic flow

# 4. Key tests (some failures expected)
npm test -- --run       # Unit tests
npm run test:e2e         # E2E tests
```

## Deployment Commands

### Frontend Production Build
```bash
npm run build            # Creates dist/ folder
npm run preview          # Test production build locally
# Deploy: Drag dist/ folder to Netlify dashboard
```

### Backend Production Build
```bash
cd backend
npm run build            # Creates backend/dist/
npm run start           # Run production server
# Deploy: Railway via GitHub integration
```

## Performance Expectations

**Production Build Metrics:**
- CSS: 86.16 kB (13.00 kB gzipped)
- JavaScript: 276.47 kB main bundle (81.33 kB gzipped)  
- Total Build Time: 10-15 seconds
- Dev Server Startup: <1 second

## Troubleshooting Commands

### Reset Environment
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm install && cd backend && PUPPETEER_SKIP_DOWNLOAD=true npm install
```

### Database Reset
```bash
cd backend
rm -rf database/vibe-booking.db
npm run db:setup:local
npm run db:seed:local
```

### Test Environment Reset
```bash
# Reinstall test dependencies
npm install jsdom @testing-library/jest-dom @testing-library/react jest-axe @playwright/test --save-dev
npx playwright install
```

---

**Remember: Always validate your changes by running the manual validation scenarios and build commands before considering your work complete.**