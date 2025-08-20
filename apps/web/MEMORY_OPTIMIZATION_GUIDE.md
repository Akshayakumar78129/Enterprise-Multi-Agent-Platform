# Memory Optimization Guide for Enterprise IQ

## Issue Resolution Summary

The churn prediction dashboard was experiencing JavaScript heap out of memory errors due to:
1. Large bundle sizes from heavy visualization libraries (Plotly.js, D3, Chart.js)
2. Multiple components loading simultaneously without lazy loading
3. Insufficient Node.js memory allocation
4. Webpack caching issues

## Implemented Solutions

### 1. Node.js Memory Allocation
- **Updated package.json scripts:**
  ```json
  {
    "dev": "cross-env NODE_OPTIONS=\"--max-old-space-size=8192\" next dev",
    "dev:memory": "cross-env NODE_OPTIONS=\"--max-old-space-size=12288\" next dev",
    "build": "cross-env NODE_OPTIONS=\"--max-old-space-size=8192\" next build"
  }
  ```
- **Added cross-env dependency** for cross-platform compatibility

### 2. Next.js Configuration Optimizations
- **Webpack Bundle Splitting:**
  ```javascript
  splitChunks: {
    cacheGroups: {
      plotly: { /* Separate chunk for Plotly.js */ },
      charts: { /* Separate chunk for chart libraries */ },
      vendor: { /* General vendor chunk */ }
    }
  }
  ```
- **Package Import Optimization:**
  ```javascript
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['plotly.js', 'react-plotly.js', 'd3', 'chart.js']
  }
  ```
- **Server External Packages:**
  ```javascript
  serverExternalPackages: ['better-sqlite3', 'sqlite3', 'mysql2']
  ```

### 3. Component Lazy Loading
- **Implemented React.lazy() for heavy components:**
  ```javascript
  const ChurnKpiTiles = lazy(() => import('...'));
  const ProbabilityHistogram = lazy(() => import('...'));
  // ... other heavy components
  ```
- **Added Suspense boundaries with loading states**
- **Dynamic imports for chart components with SSR disabled**

### 4. Loading States and UX
- **Custom LoadingSpinner component** with consistent styling
- **Suspense fallbacks** for all lazy-loaded components
- **Progressive loading** to prevent memory spikes

## Usage Instructions

### Development
```bash
# Standard development (8GB memory)
pnpm dev

# High memory development (12GB memory) - for heavy workloads
pnpm run dev:memory
```

### Production Build
```bash
# Production build with memory optimization
pnpm build
```

### Clearing Cache (if memory issues persist)
```bash
# Remove Next.js cache
Remove-Item -Recurse -Force .next

# Remove node_modules and reinstall (if needed)
Remove-Item -Recurse -Force node_modules
pnpm install
```

## Performance Monitoring

### Memory Usage Indicators
- **Normal**: < 2GB during development
- **Warning**: 2-4GB (monitor closely)
- **Critical**: > 4GB (restart development server)

### Bundle Size Monitoring
```bash
# Analyze bundle size
pnpm build
npx @next/bundle-analyzer
```

## Best Practices

### 1. Component Loading Strategy
- Use `React.lazy()` for components > 100KB
- Implement Suspense boundaries at logical component boundaries
- Avoid loading all visualizations simultaneously

### 2. Memory Management
- Restart development server every 2-3 hours during heavy development
- Monitor memory usage in Task Manager/Activity Monitor
- Use `dev:memory` script for complex dashboard development

### 3. Code Splitting
- Keep chart libraries in separate chunks
- Lazy load admin/configuration components
- Use dynamic imports for rarely used features

## Troubleshooting

### If Memory Issues Persist:
1. **Clear all caches:**
   ```bash
   Remove-Item -Recurse -Force .next
   Remove-Item -Recurse -Force node_modules/.cache
   ```

2. **Check for memory leaks:**
   - Use React DevTools Profiler
   - Monitor component mount/unmount cycles
   - Check for uncleaned event listeners

3. **Reduce concurrent operations:**
   - Limit number of charts rendered simultaneously
   - Implement virtual scrolling for large data tables
   - Use pagination for customer lists

### Emergency Fallback:
If all else fails, use the lightweight mode:
```bash
# Disable heavy features temporarily
NODE_OPTIONS="--max-old-space-size=16384" pnpm dev
```

## Future Optimizations

1. **Implement Virtual Scrolling** for large customer tables
2. **Add Service Worker** for caching static assets
3. **Optimize Chart Data** with data sampling for large datasets
4. **Implement Progressive Web App** features for better caching
5. **Consider Server-Side Rendering** for initial data loading

## Dependencies Added
- `cross-env@^7.0.3` - Cross-platform environment variable setting

## Files Modified
- `package.json` - Updated scripts and dependencies
- `next.config.js` - Added memory optimizations and bundle splitting
- `pages/customers/churn/index.tsx` - Added lazy loading and Suspense boundaries

---

**Note:** This optimization guide should be updated as new performance issues are discovered and resolved.