# Dependency Management Guide for Agents

## Agent Training: Systematic approach to fixing dependency issues

### 1. Initial Assessment

```bash
# Check for vulnerabilities
npm audit

# View dependency tree
npm ls

# Check outdated packages
npm outdated
```

### 2. Security Fixes (Priority 1)

```bash
# Attempt automatic fixes first
npm audit fix

# Force fixes if needed (careful with breaking changes)
npm audit fix --force

# Manual resolution for specific vulnerabilities
npm install package-name@latest --save-exact
```

### 3. Peer Dependency Resolution

```bash
# List peer dependency issues
npm ls 2>&1 | grep "peer dep"

# Install missing peer dependencies
npm install peer-package@version --save-dev

# For React 18 compatibility issues:
npm install react@18 react-dom@18 @types/react@18 @types/react-dom@18
```

### 4. Common Dependency Conflicts & Solutions

#### ESLint v8 to v9 Migration

```bash
# Remove old ESLint config
rm .eslintrc.json .eslintrc.js

# Install ESLint v9 with flat config
npm install -D eslint@9 @eslint/js typescript-eslint

# For React projects
npm install -D eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh
```

#### TypeScript Version Conflicts

```bash
# Ensure single TypeScript version
npm ls typescript

# Update to latest stable
npm install -D typescript@latest

# Update type definitions
npm install -D @types/node@latest
```

#### Vite Plugin Conflicts

```bash
# Common Vite + React setup
npm install -D vite@latest @vitejs/plugin-react@latest

# For React Refresh issues
npm install -D @vitejs/plugin-react-refresh@latest
```

### 5. Lock File Management

```bash
# Regenerate lock file if corrupted
rm package-lock.json
npm install

# Update lock file after manual edits
npm install --package-lock-only
```

### 6. Monorepo Dependency Issues

```bash
# For workspace projects
npm install --workspace=package-name

# Clean install across workspaces
npm ci --workspaces
```

### 7. Build Tool Conflicts

```bash
# Clear caches
rm -rf node_modules/.cache
rm -rf .parcel-cache  # For Parcel
rm -rf .next          # For Next.js

# Rebuild native dependencies
npm rebuild
```

### 8. Version Resolution Strategy

```json
// package.json overrides for specific versions
{
  "overrides": {
    "package-name": "version",
    "parent-package": {
      "child-package": "version"
    }
  }
}
```

### 9. Testing After Fixes

```bash
# Verify no vulnerabilities remain
npm audit

# Run linting
npm run lint

# Run tests
npm test

# Attempt build
npm run build
```

### 10. Prevention Strategies

- Use exact versions for critical dependencies: `--save-exact`
- Regular updates on schedule (weekly/monthly)
- CI/CD checks for vulnerabilities
- Dependabot or similar for automated PRs
- Document any version pins with reasons

### Common Error Patterns & Quick Fixes

#### "Cannot find module" after install

```bash
rm -rf node_modules package-lock.json
npm install
```

#### "ERESOLVE unable to resolve dependency tree"

```bash
npm install --legacy-peer-deps
# OR
npm install --force
```

#### "Module not found: Error: Can't resolve"

```bash
# Check if dependency is in correct section
npm install missing-package --save  # for dependencies
npm install missing-package --save-dev  # for devDependencies
```

#### Duplicate React versions

```bash
# Deduplicate
npm dedupe

# Force single version
npm install react@18 react-dom@18 --save-exact
```

### Agent Decision Tree

1. **Is it a security vulnerability?** → Fix immediately with npm audit fix
2. **Is it blocking the build?** → Resolve with targeted updates
3. **Is it a peer dependency warning?** → Install if needed, ignore if working
4. **Is it outdated but working?** → Schedule for next maintenance window
5. **Is it a major version update?** → Test thoroughly before updating

### Success Metrics

- Zero high/critical vulnerabilities
- All builds passing
- No peer dependency warnings that affect functionality
- Lock file committed and stable
- CI/CD pipeline green
