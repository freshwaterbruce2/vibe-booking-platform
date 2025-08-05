# Hotel Booking Project - Automation Guide

## Overview

This project is configured with comprehensive automation for development, testing, and deployment workflows.

## Quick Start

```bash
# Initial setup
npm run setup

# Health check
npm run health

# Development
npm run dev
```

## Git Hooks (Husky)

Pre-commit hooks automatically run:

- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking
- Unit tests

## GitHub Actions Workflows

### Continuous Integration (CI)

Triggers on: Push to main/develop, Pull requests

**Jobs:**

1. **Lint** - ESLint and Prettier checks
2. **Type Check** - TypeScript compilation
3. **Test** - Unit tests with coverage
4. **Build** - Production build
5. **E2E Tests** - Playwright browser tests
6. **Security Scan** - npm audit and Snyk
7. **Lighthouse** - Performance audit

### Deployment

Triggers on: Push to main

- Automatically deploys to GitHub Pages
- Runs all tests before deployment
- Uses GitHub Pages action for deployment

### Security

**CodeQL Analysis**

- Runs on push and weekly schedule
- Analyzes JavaScript/TypeScript code
- Reports security vulnerabilities

**Dependency Review**

- Runs on pull requests
- Checks for vulnerable dependencies
- Blocks PRs with high-severity issues

### Release Automation

Triggers on: Version tags (v\*)

- Creates GitHub releases
- Generates changelog from PRs
- Uploads build artifacts
- Supports pre-releases (alpha, beta, rc)

## Development Scripts

### Setup & Maintenance

```bash
# Initial project setup
npm run setup

# Health check
npm run health

# Clean install
npm run clean:install
```

### Code Quality

```bash
# Run all checks
npm run check:all

# Individual checks
npm run lint
npm run typecheck
npm test

# Fix issues
npm run lint:fix
npm run format
```

### Build & Analysis

```bash
# Development build
npm run dev

# Production build
npm run build

# Bundle analysis
npm run analyze

# Pre-release checks
npm run pre-release
```

### Testing

```bash
# Unit tests
npm test
npm run test:ui        # Vitest UI
npm run test:coverage  # Coverage report

# E2E tests
npm run test:e2e       # Playwright tests
```

## ESLint v9 Configuration

The project uses ESLint v9 flat config with:

- TypeScript support
- React hooks rules
- Import ordering
- Prettier integration
- Custom rules for code quality

## Pre-release Checklist

The `pre-release` script checks:

**Critical (must pass):**

- TypeScript compilation
- All tests passing
- No linting errors
- Successful build
- No high-severity vulnerabilities

**Quality (warnings):**

- Test coverage > 80%
- Bundle size < 500KB
- No console.logs in code
- No TODO comments

## Best Practices

1. **Always run health check** after pulling changes
2. **Use conventional commits** for automatic changelog
3. **Create feature branches** for new work
4. **Run pre-release check** before creating releases
5. **Keep dependencies updated** with security patches

## Troubleshooting

### Common Issues

**Git hooks not running:**

```bash
npx husky install
```

**Type errors after dependency update:**

```bash
npm run clean:install
npm run typecheck
```

**Failed E2E tests:**

```bash
# Run with UI for debugging
npx playwright test --ui
```

## Monitoring

- Check GitHub Actions tab for CI status
- Review Dependabot alerts for security updates
- Monitor bundle size with `npm run analyze`
- Track test coverage trends

## Contributing

1. Fork the repository
2. Create feature branch
3. Run `npm run setup`
4. Make changes with tests
5. Run `npm run check:all`
6. Submit PR with description

All PRs must pass CI checks before merging.
