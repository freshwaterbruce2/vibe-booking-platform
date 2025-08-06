#!/bin/bash
# Husky and Git Hooks Setup Script
# Agent Training: Run this script to set up pre-commit and pre-push hooks

echo "Setting up Husky and Git hooks for code quality automation..."

# Install Husky and lint-staged
npm install -D husky lint-staged

# Initialize Husky
npx husky init

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged for incremental linting and formatting
npx lint-staged
EOF

# Create pre-push hook
cat > .husky/pre-push << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running pre-push checks..."

# Run tests
echo "Running tests..."
npm test -- --watchAll=false

# Run type checking for TypeScript projects
if [ -f "tsconfig.json" ]; then
  echo "Running TypeScript type checking..."
  npm run typecheck
fi

# Run build to ensure it compiles
echo "Running build..."
npm run build

echo "All pre-push checks passed!"
EOF

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push

# Create lint-staged configuration
cat > .lintstagedrc.json << 'EOF'
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ],
  "*.css": [
    "prettier --write"
  ]
}
EOF

# Update package.json scripts
echo "Updating package.json scripts..."
npm pkg set scripts.prepare="husky"
npm pkg set scripts.lint="eslint . --max-warnings 0"
npm pkg set scripts.lint:fix="eslint . --fix"
npm pkg set scripts.format="prettier --write ."
npm pkg set scripts.format:check="prettier --check ."
npm pkg set scripts.typecheck="tsc --noEmit"

echo "Husky setup complete! Git hooks are now active."
echo ""
echo "Pre-commit hook will:"
echo "  - Run ESLint fixes on staged files"
echo "  - Format code with Prettier"
echo ""
echo "Pre-push hook will:"
echo "  - Run all tests"
echo "  - Check TypeScript types"
echo "  - Verify build succeeds"