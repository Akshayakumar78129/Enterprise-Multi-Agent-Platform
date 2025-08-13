# 🎨 Churn Prediction Dashboard - Complete UI Style Guide

## 📋 Table of Contents
1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Layout & Spacing](#layout--spacing)
4. [Component Patterns](#component-patterns)
5. [Animations & Effects](#animations--effects)
6. [Recharts Configuration](#recharts-configuration)
7. [Responsive Design](#responsive-design)
8. [Implementation Examples](#implementation-examples)

---

## 🎨 Color Palette

### Primary Colors
```css
/* Main Brand Colors */
--primary-blue: #3b82f6
--primary-purple: #8b5cf6
--primary-pink: #ec4899

/* Gradient Combinations */
--gradient-primary: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)
--gradient-blue-purple: linear-gradient(135deg, #3b82f6, #8b5cf6)
--gradient-cyan-purple: linear-gradient(135deg, #00e0ff, #e930ff)
```

### Risk Level Colors
```css
/* Risk Level System */
--risk-very-high: #ef4444 (Red)
--risk-high: #f97316 (Orange)
--risk-medium: #eab308 (Yellow)
--risk-low: #22c55e (Green)

/* Risk Color Variations */
--risk-very-high-light: #ef444420 (20% opacity)
--risk-very-high-border: #ef444440 (40% opacity)
```

### Background Colors
```css
/* Main Backgrounds */
--bg-primary: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%, #f8fafc 100%)
--bg-card: rgba(255, 255, 255, 0.95)
--bg-card-hover: rgba(255, 255, 255, 0.98)

/* Glass Morphism */
--glass-bg: rgba(255, 255, 255, 0.9)
--glass-backdrop: blur(20px)
--glass-border: 1px solid rgba(59, 130, 246, 0.1)
```

### Text Colors
```css
/* Text Hierarchy */
--text-primary: #1e293b
--text-secondary: #64748b
--text-muted: #94a3b8
--text-light: #f8fafc
--text-accent: #3b82f6
```

---

## 📝 Typography

### Font System
```css
/* Primary Font */
font-family: 'Inter', sans-serif

/* Font Weights */
--font-light: 300
--font-regular: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800

/* Font Sizes */
--text-xs: 12px
--text-sm: 14px
--text-base: 16px
--text-lg: 18px
--text-xl: 20px
--text-2xl: 24px
--text-3xl: 28px
--text-4xl: 32px
--text-5xl: 42px
```

### Typography Patterns
```css
/* Main Heading */
.main-heading {
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Section Heading */
.section-heading {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Card Title */
.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}
```

---

## 📐 Layout & Spacing

### Spacing System
```css
/* Spacing Scale */
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-15: 60px

/* Component Spacing */
--card-padding: 24px
--section-margin: 60px
--grid-gap: 48px (desktop), 32px (tablet), 24px (mobile)
```

### Grid System
```css
/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* Desktop */
  gap: 48px;
  max-width: 1800px;
  margin: 0 auto;
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}
```

### Container Sizes
```css
/* Container Widths */
--container-sm: 640px
--container-md: 768px
--container-lg: 1024px
--container-xl: 1280px
--container-2xl: 1536px
--container-max: 1800px
```

---

## 🧩 Component Patterns

### Card Component
```css
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 0 40px rgba(59, 130, 246, 0.05);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.12), 0 0 60px rgba(59, 130, 246, 0.08);
}
```

### KPI Tile Component
```css
.kpi-tile {
  min-width: 200px;
  height: 160px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.kpi-tile:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 0 40px ${color}20;
}
```

### Button Styles
```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

/* Chat Button */
.chat-button {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  color: #ffffff;
  font-size: 28px;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
}

.chat-button:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 40px rgba(59, 130, 246, 0.6);
}
```

### Input Styles
```css
.input-field {
  width: 100%;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  background: rgba(255, 255, 255, 0.8);
  color: #1e293b;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.input-field:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
}
```

---

## ✨ Animations & Effects

### Keyframe Animations
```css
/* Float Animation */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(1deg); }
  66% { transform: translateY(5px) rotate(-1deg); }
}

/* Fade In Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

/* Spin */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Transition Patterns
```css
/* Standard Transitions */
--transition-fast: all 0.2s ease
--transition-normal: all 0.3s ease
--transition-slow: all 0.4s cubic-bezier(0.4, 0, 0.2, 1)
--transition-bounce: all 0.6s cubic-bezier(0.4, 0, 0.2, 1)

/* Component Entrance */
.component-enter {
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.component-enter-active {
  transform: translateY(0) scale(1);
  opacity: 1;
}
```

---

## 📊 Recharts Configuration

### Chart Container Setup
```jsx
// Standard Chart Container
<ResponsiveContainer width="100%" height="100%">
  <BarChart
    data={data}
    margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
  >
    {/* Chart content */}
  </BarChart>
</ResponsiveContainer>
```

### Chart Styling
```jsx
// CartesianGrid
<CartesianGrid 
  strokeDasharray="3 3" 
  stroke="rgba(148, 163, 184, 0.2)" 
/>

// XAxis
<XAxis 
  tick={{ fill: '#64748b', fontSize: 12 }}
  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
  tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
/>

// YAxis
<YAxis 
  tick={{ fill: '#1e293b', fontSize: 14, fontWeight: 600 }}
  axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
  tickLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
/>
```

### Custom Tooltip
```jsx
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        border: `2px solid ${data.color}`,
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: `0 20px 40px rgba(0, 0, 0, 0.1), 0 0 30px ${data.color}30`,
        fontSize: 14,
        fontWeight: 600,
        color: '#1e293b'
      }}>
        {/* Tooltip content */}
      </div>
    );
  }
  return null;
};
```

### Custom Bar Component
```jsx
const CustomBar = (props) => {
  const { fill, payload, x, y, width, height } = props;
  
  return (
    <g>
      {/* Gradient Definition */}
      <defs>
        <linearGradient id={`gradient-${payload.name}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fill} stopOpacity="0.8" />
          <stop offset="50%" stopColor={fill} stopOpacity="1" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      {/* Main Bar */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#gradient-${payload.name})`}
        rx="6"
        style={{
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      />
    </g>
  );
};
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Breakpoint System */
--breakpoint-sm: 640px
--breakpoint-md: 768px
--breakpoint-lg: 1024px
--breakpoint-xl: 1280px
--breakpoint-2xl: 1536px
--breakpoint-dashboard: 1400px
```

### Responsive Patterns
```css
/* Desktop First Approach */
@media (max-width: 1400px) {
  .dashboard-grid {
    grid-template-columns: 1fr !important;
    gap: 32px !important;
    max-width: 900px;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    gap: 24px !important;
    padding: 10px 0 !important;
  }
  
  .chart-container {
    min-height: 450px !important;
    padding: 4px;
  }
}
```

### Dynamic Sizing
```jsx
// Window Width Hook Usage
const [windowWidth, setWindowWidth] = useState(
  typeof window !== 'undefined' ? window.innerWidth : 1200
);

// Responsive Grid Columns
gridTemplateColumns: windowWidth > 1400 ? 'repeat(2, 1fr)' : '1fr'

// Responsive Heights
gridAutoRows: windowWidth > 1400 ? '650px' : windowWidth > 768 ? '580px' : '500px'

// Responsive Padding
padding: windowWidth > 1400 ? '40px 60px' : windowWidth > 768 ? '32px 40px' : '24px 20px'
```

---

## 🎯 Implementation Examples

### Complete Card Component
```jsx
const ChartCard = ({ children, title, isVisible = true }) => (
  <div style={{
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 0 40px rgba(59, 130, 246, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(59, 130, 246, 0.1)',
    overflow: 'hidden',
    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
    opacity: isVisible ? 1 : 0,
    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box'
  }}>
    {/* Animated background */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
      pointerEvents: 'none',
      animation: 'float 6s ease-in-out infinite'
    }} />
    
    {/* Header */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
      zIndex: 1,
      position: 'relative'
    }}>
      <h3 style={{
        margin: 0,
        color: '#1e293b',
        fontWeight: 800,
        fontSize: 24,
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {title}
      </h3>
    </div>
    
    {/* Content */}
    <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  </div>
);
```

### Risk Badge Component
```jsx
const getRiskBadge = (riskLevel, probability) => {
  const colors = {
    'Very High': '#ef4444',
    'High': '#f97316',
    'Medium': '#eab308',
    'Low': '#22c55e'
  };
  
  const color = colors[riskLevel] || '#888';
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      borderRadius: 20,
      background: `${color}20`,
      border: `1px solid ${color}40`,
      fontSize: 12,
      fontWeight: 600,
      color: color
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}60`
      }} />
      {riskLevel} ({(probability * 100).toFixed(1)}%)
    </div>
  );
};
```

### Loading Spinner
```jsx
const LoadingSpinner = ({ size = 20, color = '#3b82f6' }) => (
  <div style={{
    width: size,
    height: size,
    border: `2px solid rgba(59, 130, 246, 0.3)`,
    borderTop: `2px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }} />
);
```

---

## 🎨 Chat Component Styling

### Chat Container
```jsx
const chatContainerStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: '420px',
  height: '100vh',
  background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.98), rgba(42, 47, 62, 0.98))',
  backdropFilter: 'blur(20px)',
  borderLeft: '1px solid rgba(59, 130, 246, 0.3)',
  zIndex: 1002,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.3)'
};
```

### Message Bubbles
```jsx
const messageStyle = (type) => ({
  maxWidth: '85%',
  padding: '14px 18px',
  borderRadius: type === 'user' 
    ? '20px 20px 6px 20px' 
    : '20px 20px 20px 6px',
  background: type === 'user' 
    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
    : 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))',
  color: type === 'user' ? '#ffffff' : '#f8fafc',
  fontSize: '14px',
  lineHeight: '1.5',
  fontWeight: type === 'user' ? '600' : '400',
  border: type === 'bot' ? '1px solid rgba(58, 68, 89, 0.3)' : 'none',
  boxShadow: type === 'user' 
    ? '0 4px 15px rgba(59, 130, 246, 0.3)' 
    : '0 4px 15px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(10px)',
  whiteSpace: 'pre-wrap'
});
```

---

## 📋 Quick Reference Checklist

### ✅ Essential Elements for Any Component
- [ ] Glass morphism background (`rgba(255, 255, 255, 0.95)` + `blur(20px)`)
- [ ] Rounded corners (`border-radius: 20px` for cards, `12px` for inputs)
- [ ] Subtle borders (`1px solid rgba(59, 130, 246, 0.1)`)
- [ ] Smooth transitions (`transition: all 0.3s ease`)
- [ ] Proper shadows (`0 20px 60px rgba(0, 0, 0, 0.08)`)
- [ ] Gradient text for headings
- [ ] Hover effects with transform and shadow changes
- [ ] Responsive design considerations
- [ ] Proper color contrast ratios
- [ ] Loading states with spinners

### 🎨 Color Usage Guidelines
- Use **blue-purple gradients** for primary actions and headings
- Use **risk colors** consistently across all risk-related components
- Apply **20% opacity** for background colors, **40%** for borders
- Use **#1e293b** for primary text, **#64748b** for secondary text
- Apply **glass morphism** for all card backgrounds

### 📐 Spacing Guidelines
- Use **24px padding** for cards
- Use **48px gaps** for desktop grids, **32px** for tablet, **24px** for mobile
- Use **60px margins** between major sections
- Use **12px gaps** for small elements, **16px** for medium, **24px** for large

This style guide ensures consistency across all components and provides a solid foundation for implementing the impressive UI design that your boss loved! 🚀