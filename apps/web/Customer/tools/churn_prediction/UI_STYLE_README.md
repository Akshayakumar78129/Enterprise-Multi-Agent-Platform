# Churn Prediction Dashboard - UI Style Guide & Implementation

## 🎨 Complete Visual Design System

This document provides a comprehensive guide to replicate the exact visual styling, colors, animations, and effects used in the Churn Prediction Dashboard. Copy these specifications to achieve identical aesthetics in your implementation.

---

## 🎯 Core Design Philosophy

- **Glass Morphism**: Semi-transparent layers with backdrop blur effects
- **Dark Theme**: Professional dark background with vibrant accent colors
- **Gradient Accents**: Multi-color gradients for modern appeal
- **Smooth Animations**: Cubic-bezier transitions for fluid interactions
- **Depth & Dimension**: Strategic shadows and layering for 3D effect

---

## 🌈 Color Palette

### Primary Colors
```css
/* Background Colors */
--bg-primary: rgba(30, 39, 56, 0.9);     /* Main container background */
--bg-secondary: rgba(15, 20, 25, 0.8);   /* Secondary elements */
--bg-tertiary: rgba(15, 20, 25, 0.6);    /* Tertiary/info sections */
--bg-glass: rgba(30, 39, 56, 0.95);      /* Hover state glass effect */

/* Text Colors */
--text-primary: #f7f9fb;                 /* Main text */
--text-secondary: rgba(247, 249, 251, 0.8); /* Secondary text */
--text-tertiary: rgba(247, 249, 251, 0.7);  /* Muted text */

/* Accent Colors */
--accent-cyan: #00e0ff;                  /* Primary accent */
--accent-purple: #7c3aed;                /* Secondary accent */
--accent-blue: #3b82f6;                  /* Default blue */
```

### Risk Level Colors
```css
/* Risk Indicators */
--risk-critical: #FF4444;    /* Very High Risk - Red */
--risk-high: #FF8800;         /* High Risk - Orange */
--risk-medium: #FFB800;       /* Medium Risk - Yellow */
--risk-low: #00E676;          /* Low Risk - Green */
```

### Feature-Specific Colors
```css
/* KPI Tiles */
--kpi-overall-risk: #FF6B6B;
--kpi-critical-customers: #FF8E53;
--kpi-model-accuracy: #4ECDC4;
--kpi-primary-factor: #45B7D1;
--kpi-risk-transitions: #96CEB4;

/* Status Indicators */
--trend-up: #39ff14;          /* Positive trend */
--trend-down: #ff1f4f;        /* Negative trend */
--trend-neutral: #ffb800;     /* Neutral trend */
```

---

## 🌟 Gradient Definitions

### Linear Gradients
```css
/* Primary gradient for titles and buttons */
background: linear-gradient(135deg, #00e0ff, #7c3aed);

/* Container backgrounds */
background: linear-gradient(135deg, rgba(30, 39, 56, 0.8) 0%, rgba(35, 42, 54, 0.8) 100%);

/* Hover state container */
background: linear-gradient(135deg, rgba(30, 39, 56, 0.95) 0%, rgba(60, 68, 89, 0.95) 100%);

/* Icon backgrounds */
background: linear-gradient(135deg, #FF4444, #FFB800);
background: linear-gradient(135deg, #00E676, #7c3aed);
```

### Radial Gradients
```css
/* Background particles effect */
background: radial-gradient(circle at 30% 20%, ${color}15 0%, transparent 50%), 
            radial-gradient(circle at 70% 80%, ${color}10 0%, transparent 50%);

/* Component background accents */
background: radial-gradient(circle at 20% 80%, rgba(255, 68, 68, 0.1) 0%, transparent 50%), 
            radial-gradient(circle at 80% 20%, rgba(0, 230, 118, 0.1) 0%, transparent 50%);
```

---

## ✨ Glass Morphism Effects

### Container Styling
```css
.glass-container {
  background: rgba(30, 39, 56, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 224, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 
              0 0 40px rgba(0, 224, 255, 0.1);
}
```

### KPI Tile Glass Effect
```css
.kpi-tile {
  background: linear-gradient(135deg, rgba(30, 39, 56, 0.8) 0%, rgba(35, 42, 54, 0.8) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2), 
              0 0 20px ${accentColor}20;
}
```

---

## 🎭 Hover Effects & Transitions

### KPI Tile Hover Transformation
```css
.kpi-tile {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0) scale(1);
}

.kpi-tile:hover {
  transform: translateY(-12px) scale(1.02);
  background: linear-gradient(135deg, rgba(30, 39, 56, 0.95) 0%, rgba(60, 68, 89, 0.95) 100%);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 
              0 0 40px ${accentColor}30, 
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 2px solid ${accentColor}80;
}
```

### Button Hover Animation
```css
.action-button {
  background: linear-gradient(135deg, #00e0ff, #7c3aed);
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(0, 224, 255, 0.4);
}
```

### Interactive Elements
```css
/* Time range selector buttons */
.time-selector {
  transition: all 0.2s ease;
}

.time-selector:hover {
  background: rgba(0, 224, 255, 0.2);
}

.time-selector.active {
  background: linear-gradient(135deg, #00e0ff, #7c3aed);
}
```

---

## 🎬 Animations

### Value Counter Animation
```javascript
// Animated number counting effect
const animateValue = (start, end, duration) => {
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out-quart easing function
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentValue = Math.round(start + (end - start) * easeOutQuart);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
};

// Usage: Duration 1500ms for smooth counting
animateValue(0, targetValue, 1500);
```

### Fade-in Animation with Delay
```css
.fade-in-element {
  opacity: 0;
  animation: fadeIn 0.6s ease-out forwards;
  animation-delay: var(--delay);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Pulse Animation for Indicators
```css
.pulse-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 224, 255, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 224, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 224, 255, 0);
  }
}
```

---

## 🎆 Special Effects

### Glowing Border Effect
```css
.glow-border {
  position: relative;
}

.glow-border::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, ${accentColor}40, transparent, ${accentColor}40);
  border-radius: 22px;
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
}

.glow-border:hover::before {
  opacity: 1;
}
```

### Text Shadow & Glow
```css
.glowing-text {
  text-shadow: 0 0 20px ${accentColor}40;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.gradient-text {
  background: linear-gradient(135deg, #00e0ff, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Bottom Accent Line
```css
.accent-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%);
  opacity: 0.5;
  transition: opacity 0.4s ease;
}

.container:hover .accent-line {
  opacity: 1;
}
```

---

## 📊 Chart Styling (Plotly.js)

### Chart Configuration
```javascript
const plotlyLayout = {
  plot_bgcolor: 'transparent',
  paper_bgcolor: 'transparent',
  font: { 
    family: 'Inter, sans-serif',
    color: '#f7f9fb'
  },
  margin: { l: 60, r: 20, t: 20, b: 60 },
  xaxis: {
    gridcolor: 'rgba(255, 255, 255, 0.1)',
    zeroline: false,
    tickfont: { color: '#f7f9fb', size: 12 }
  },
  yaxis: {
    gridcolor: 'rgba(255, 255, 255, 0.1)',
    zeroline: false,
    tickfont: { color: '#f7f9fb', size: 12 }
  },
  hoverlabel: {
    bgcolor: 'rgba(30, 39, 56, 0.95)',
    bordercolor: '#00e0ff',
    font: { color: '#f7f9fb', size: 14 }
  }
};
```

### Bar Chart Colors
```javascript
const barColors = data.map((value, index) => {
  const baseColor = value > 0.25 ? '#FF4444' : 
                   value > 0.15 ? '#FF8800' : 
                   value > 0.10 ? '#FFB800' : '#00E676';
  return isHovered ? `${baseColor}FF` : `${baseColor}DD`;
});
```

---

## 📱 Typography

### Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
```

### Font Weights & Sizes
```css
/* Headings */
.heading-primary {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

/* KPI Values */
.kpi-value {
  font-size: 36px;
  font-weight: 900;
}

/* Labels */
.label-text {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  opacity: 0.95;
}

/* Body Text */
.body-text {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}
```

---

## 🎪 Interactive Components

### Range Slider Styling
```css
input[type="range"] {
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: rgba(0, 224, 255, 0.2);
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00e0ff, #7c3aed);
  cursor: pointer;
  transition: all 0.2s ease;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(0, 224, 255, 0.6);
}
```

### Select Dropdown
```css
select {
  background: rgba(15, 20, 25, 0.8);
  color: #f7f9fb;
  border: 1px solid rgba(0, 224, 255, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
}

select:hover {
  border-color: rgba(0, 224, 255, 0.5);
  background: rgba(15, 20, 25, 0.9);
}
```

---

## 🔧 Implementation Tips

### 1. Layer Structure
```html
<div class="container">
  <!-- Background gradient layer -->
  <div class="background-gradient"></div>
  
  <!-- Content layer -->
  <div class="content">
    <!-- Your content here -->
  </div>
  
  <!-- Accent effects layer -->
  <div class="accent-effects"></div>
</div>
```

### 2. Z-Index Management
```css
--z-background: -1;
--z-content: 1;
--z-hover: 2;
--z-modal: 10;
```

### 3. Performance Optimization
- Use `will-change` for animated properties
- Implement `transform` instead of `top/left` for animations
- Use CSS containment for complex components
- Debounce hover events for heavy effects

### 4. Browser Compatibility
```css
/* Webkit support */
-webkit-backdrop-filter: blur(20px);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;

/* Firefox support */
-moz-backdrop-filter: blur(20px);

/* Standard */
backdrop-filter: blur(20px);
background-clip: text;
```

---

## 📋 Complete Component Example

Here's a complete KPI tile implementation with all effects:

```jsx
const KpiTile = ({ value, label, trend, color }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      style={{
        minWidth: 200,
        height: 160,
        background: isHovered 
          ? 'linear-gradient(135deg, rgba(30, 39, 56, 0.95) 0%, rgba(60, 68, 89, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(30, 39, 56, 0.8) 0%, rgba(35, 42, 54, 0.8) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f7f9fb',
        fontFamily: 'Inter, sans-serif',
        boxShadow: isHovered 
          ? `0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px ${color}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          : `0 10px 30px rgba(0, 0, 0, 0.2), 0 0 20px ${color}20`,
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
        border: isHovered ? `2px solid ${color}80` : '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 30% 20%, ${color}15 0%, transparent 50%)`,
        opacity: isHovered ? 1 : 0.6,
        transition: 'opacity 0.4s ease'
      }} />
      
      {/* Value */}
      <div style={{ 
        fontSize: 36, 
        fontWeight: 900,
        color: color,
        textShadow: `0 0 20px ${color}40`,
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
      }}>
        {value}
      </div>
      
      {/* Label */}
      <div style={{ 
        fontSize: 13, 
        opacity: 0.95,
        fontWeight: 600,
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
      
      {/* Bottom accent */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
        opacity: isHovered ? 1 : 0.5,
        transition: 'opacity 0.4s ease'
      }} />
    </div>
  );
};
```

---

## 🚀 Quick Start Copy-Paste

To quickly implement this design system, copy this CSS into your project:

```css
:root {
  /* Colors */
  --bg-primary: rgba(30, 39, 56, 0.9);
  --text-primary: #f7f9fb;
  --accent-cyan: #00e0ff;
  --accent-purple: #7c3aed;
  
  /* Transitions */
  --transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-quick: all 0.2s ease;
  
  /* Shadows */
  --shadow-primary: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 224, 255, 0.1);
  --shadow-hover: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 224, 255, 0.3);
}

.dashboard-container {
  background: var(--bg-primary);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(0, 224, 255, 0.2);
  box-shadow: var(--shadow-primary);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  padding: 32px;
  transition: var(--transition-smooth);
}

.dashboard-container:hover {
  box-shadow: var(--shadow-hover);
}
```

---

## 📝 Notes

- All colors include alpha channel for transparency control
- Animations use hardware acceleration for smooth performance
- Effects are optimized for 60fps rendering
- Design is responsive and scales with container size
- All gradients use 135deg angle for consistency
- Hover states provide clear visual feedback
- Transitions use cubic-bezier for natural motion

---

**Created for Churn Prediction Dashboard v2.0**  
*For questions or customization needs, refer to the component source files in `/ui/components/`*