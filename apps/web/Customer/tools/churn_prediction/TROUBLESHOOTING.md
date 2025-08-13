# 🔧 Troubleshooting Guide - Churn Prediction Dashboard

## 🚨 Common Issues & Solutions

### 1. **Charts Not Displaying** 📊

**Symptoms:**
- Empty chart containers
- Loading spinners that don't disappear
- Console errors about Recharts

**Solutions:**
```bash
# Ensure Recharts is properly installed
cd C:\Users\yashr\Desktop\ARI\multiagent-agency\apps\web
pnpm install recharts

# Clear cache and restart
pnpm clean
pnpm dev
```

**Check:**
- ✅ Recharts version 3.1.2 is installed
- ✅ No TypeScript errors in console
- ✅ Data is being fetched properly

### 2. **Animations Not Working** ✨

**Symptoms:**
- Elements appear instantly without animation
- No smooth transitions
- KPI numbers don't count up

**Solutions:**
```css
/* Check if user has reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Check:**
- ✅ Browser supports CSS animations
- ✅ No accessibility settings blocking animations
- ✅ JavaScript is enabled

### 3. **Styling Issues** 🎨

**Symptoms:**
- Colors look wrong
- Layout is broken
- Text is hard to read

**Solutions:**
```bash
# Clear browser cache
Ctrl + Shift + R (hard refresh)

# Check for CSS conflicts
# Open DevTools > Elements > Styles
```

**Check:**
- ✅ No CSS conflicts in DevTools
- ✅ Fonts are loading properly
- ✅ Browser zoom is at 100%

### 4. **Performance Issues** ⚡

**Symptoms:**
- Slow loading
- Laggy animations
- Browser freezing

**Solutions:**
```bash
# Check bundle size
pnpm build
pnpm analyze

# Optimize if needed
# Remove unused imports
# Check for memory leaks
```

**Check:**
- ✅ No infinite re-renders in React DevTools
- ✅ Memory usage is reasonable
- ✅ No console errors

### 5. **Data Not Loading** 📡

**Symptoms:**
- Empty charts
- "Loading..." states persist
- API errors in console

**Solutions:**
```bash
# Check API endpoints
curl http://localhost:3000/api/churn-customers

# Verify database connection
# Check server logs
```

**Check:**
- ✅ API endpoints are responding
- ✅ Database is connected
- ✅ No CORS issues

## 🔍 Debugging Steps

### **Step 1: Check Console** 🖥️
```javascript
// Open DevTools (F12)
// Look for errors in Console tab
// Common issues:
// - Module not found errors
// - TypeScript compilation errors
// - Runtime JavaScript errors
```

### **Step 2: Verify Installation** 📦
```bash
# Check if all dependencies are installed
pnpm list recharts
pnpm list react
pnpm list next

# Reinstall if needed
pnpm install
```

### **Step 3: Check Network** 🌐
```bash
# Open DevTools > Network tab
# Refresh page
# Look for failed requests (red entries)
# Check API response status codes
```

### **Step 4: React DevTools** ⚛️
```bash
# Install React DevTools browser extension
# Check component tree
# Look for unnecessary re-renders
# Verify props are being passed correctly
```

## 🛠 Quick Fixes

### **Reset Everything** 🔄
```bash
# Nuclear option - reset everything
cd C:\Users\yashr\Desktop\ARI\multiagent-agency\apps\web
rm -rf node_modules
rm -rf .next
pnpm install
pnpm dev
```

### **Clear Browser Data** 🧹
```bash
# Chrome: Settings > Privacy > Clear browsing data
# Firefox: Settings > Privacy > Clear Data
# Or use incognito/private mode
```

### **Check Browser Compatibility** 🌐
**Supported Browsers:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Not Supported:**
- ❌ Internet Explorer
- ❌ Very old browser versions

## 🎯 Component-Specific Issues

### **KPI Tiles** 🎯
```typescript
// If animations aren't working:
// Check useEffect dependencies
useEffect(() => {
  setIsVisible(true);
}, []); // Empty dependency array is important
```

### **Recharts Components** 📊
```typescript
// If charts are empty:
// Verify data format
const data = [
  { name: 'Low', value: 10 },
  { name: 'High', value: 20 }
];

// Check ResponsiveContainer
<ResponsiveContainer width="100%" height="100%">
  <BarChart data={data}>
    {/* Chart content */}
  </BarChart>
</ResponsiveContainer>
```

### **Table Issues** 📋
```typescript
// If table is not responsive:
// Check container styling
<div style={{ overflowX: 'auto' }}>
  <table style={{ width: '100%' }}>
    {/* Table content */}
  </table>
</div>
```

## 📞 Getting Help

### **Check Logs** 📝
```bash
# Server logs
pnpm dev

# Browser console
F12 > Console

# Network requests
F12 > Network
```

### **Common Error Messages** ⚠️

**"Module not found: Can't resolve 'recharts'"**
```bash
Solution: pnpm install recharts
```

**"Cannot read property 'map' of undefined"**
```typescript
// Solution: Add default values
const data = customers || [];
```

**"Hydration failed"**
```typescript
// Solution: Ensure server and client render the same
// Use useEffect for client-only code
```

### **Performance Monitoring** 📈
```javascript
// Check React performance
// DevTools > Profiler tab
// Record interactions
// Look for slow components
```

## ✅ Health Check

Run this checklist to verify everything is working:

### **Visual Check** 👀
- [ ] Page loads with smooth animations
- [ ] All 4 KPI tiles are visible and animated
- [ ] All 4 charts are displaying data
- [ ] Table is showing customer data
- [ ] Colors match the design system
- [ ] No layout issues or overlapping elements

### **Interaction Check** 🖱️
- [ ] KPI tiles have hover effects
- [ ] Charts respond to hover with tooltips
- [ ] Table rows highlight on hover
- [ ] Sorting works on table columns
- [ ] Time range buttons work on temporal chart
- [ ] Feature importance sorting works

### **Performance Check** ⚡
- [ ] Page loads in under 3 seconds
- [ ] Animations are smooth (60fps)
- [ ] No console errors
- [ ] Memory usage is stable
- [ ] No layout shifts during load

### **Responsive Check** 📱
- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] Touch interactions work
- [ ] Text is readable on all sizes

## 🎉 Success!

If all checks pass, your dashboard is working perfectly! 

**Enjoy your beautiful new Churn Prediction Dashboard!** ✨

---

*Still having issues? Check the component source code in the `/ui/components/` directory for detailed implementation.*