export const segmentationTheme = {
  colors: {
    // Background Colors
    bgPrimary: 'rgba(30, 39, 56, 0.9)',
    bgSecondary: 'rgba(15, 20, 25, 0.8)',
    bgTertiary: 'rgba(15, 20, 25, 0.6)',
    bgGlass: 'rgba(30, 39, 56, 0.95)',
    bgDark: '#0a0f1b',
    
    // Text Colors
    textPrimary: '#f7f9fb',
    textSecondary: 'rgba(247, 249, 251, 0.8)',
    textTertiary: 'rgba(247, 249, 251, 0.7)',
    
    // Accent Colors
    accentCyan: '#00e0ff',
    accentPurple: '#7c3aed',
    accentBlue: '#3b82f6',
    accentMagenta: '#e930ff',
    
    // Segment Colors
    segment1: '#00e0ff',
    segment2: '#e930ff',
    segment3: '#5fd4d6',
    segment4: '#aa45dd',
    segment5: '#43cad0',
    segment6: '#ff6b6b',
    segment7: '#ffd93d',
    segment8: '#6bcf7f',
    
    // Status Colors
    success: '#00E676',
    warning: '#FFB800',
    error: '#FF4444',
    info: '#3b82f6',
    
    // Trend Colors
    trendUp: '#39ff14',
    trendDown: '#ff1f4f',
    trendNeutral: '#ffb800',
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #00e0ff, #7c3aed)',
    container: 'linear-gradient(135deg, rgba(30, 39, 56, 0.8) 0%, rgba(35, 42, 54, 0.8) 100%)',
    containerHover: 'linear-gradient(135deg, rgba(30, 39, 56, 0.95) 0%, rgba(60, 68, 89, 0.95) 100%)',
    accent: 'linear-gradient(135deg, #FF4444, #FFB800)',
    success: 'linear-gradient(135deg, #00E676, #7c3aed)',
  },
  
  effects: {
    glassShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 224, 255, 0.1)',
    glassHoverShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 224, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    tileShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    backdropBlur: 'blur(20px)',
  },
  
  animation: {
    fast: '0.2s ease',
    normal: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '50%',
  },
};

export const getSegmentColor = (index: number): string => {
  const colors = [
    segmentationTheme.colors.segment1,
    segmentationTheme.colors.segment2,
    segmentationTheme.colors.segment3,
    segmentationTheme.colors.segment4,
    segmentationTheme.colors.segment5,
    segmentationTheme.colors.segment6,
    segmentationTheme.colors.segment7,
    segmentationTheme.colors.segment8,
  ];
  return colors[index % colors.length];
};