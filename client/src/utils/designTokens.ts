// Design Tokens System for Haazir Attendance Management
// Centralized design system for consistent UI/UX across the application

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Secondary Colors
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Accent Colors
  accent: {
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    emerald: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
  },
  
  // Status Colors
  status: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
  },
  
  // Neutral Colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Glassmorphism Colors
  glass: {
    white: 'rgba(255, 255, 255, 0.25)',
    dark: 'rgba(0, 0, 0, 0.25)',
    primary: 'rgba(59, 130, 246, 0.15)',
    secondary: 'rgba(100, 116, 139, 0.15)',
  },
  
  // Gradient Definitions
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
    sunset: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ocean: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cosmic: 'linear-gradient(135deg, #ff7eb9 0%, #ff65a3 100%)',
  }
};

export const spacing = {
  // Base spacing scale (in rem)
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    serif: ['Georgia', 'Cambria', 'serif'],
    mono: ['Monaco', 'Consolas', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],       // 72px
    '8xl': ['6rem', { lineHeight: '1' }],         // 96px
    '9xl': ['8rem', { lineHeight: '1' }],         // 128px
  },
  
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  lineHeight: {
    3: '.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
};

export const shadows = {
  // Standard shadows
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
  
  // Glassmorphism shadows
  glass: {
    light: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    medium: '0 8px 32px 0 rgba(31, 38, 135, 0.5)',
    heavy: '0 8px 32px 0 rgba(31, 38, 135, 0.7)',
  },
  
  // Colored shadows
  colored: {
    blue: '0 10px 15px -3px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(59, 130, 246, 0.05)',
    green: '0 10px 15px -3px rgba(34, 197, 94, 0.4), 0 4px 6px -2px rgba(34, 197, 94, 0.05)',
    purple: '0 10px 15px -3px rgba(168, 85, 247, 0.4), 0 4px 6px -2px rgba(168, 85, 247, 0.05)',
    red: '0 10px 15px -3px rgba(239, 68, 68, 0.4), 0 4px 6px -2px rgba(239, 68, 68, 0.05)',
  },
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  base: '0.25rem',   // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
};

export const animations = {
  // Duration
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  
  // Timing functions
  timingFunction: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Animation presets
  presets: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
      duration: '300ms',
      timingFunction: 'ease-out',
    },
    slideUp: {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
      duration: '300ms',
      timingFunction: 'ease-out',
    },
    slideDown: {
      from: { transform: 'translateY(-20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
      duration: '300ms',
      timingFunction: 'ease-out',
    },
    slideLeft: {
      from: { transform: 'translateX(20px)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
      duration: '300ms',
      timingFunction: 'ease-out',
    },
    slideRight: {
      from: { transform: 'translateX(-20px)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
      duration: '300ms',
      timingFunction: 'ease-out',
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
      duration: '200ms',
      timingFunction: 'ease-out',
    },
    scaleOut: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0.95)', opacity: 0 },
      duration: '150ms',
      timingFunction: 'ease-in',
    },
    bounce: {
      from: { transform: 'scale(1)' },
      to: { transform: 'scale(1.05)' },
      duration: '150ms',
      timingFunction: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Keyframes
  keyframes: {
    spin: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    ping: {
      '75%, 100%': { transform: 'scale(2)', opacity: 0 },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
      '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
    },
    wiggle: {
      '0%, 100%': { transform: 'rotate(-3deg)' },
      '50%': { transform: 'rotate(3deg)' },
    },
    float: {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    slideInLeft: {
      from: { transform: 'translateX(-100%)' },
      to: { transform: 'translateX(0)' },
    },
    slideInRight: {
      from: { transform: 'translateX(100%)' },
      to: { transform: 'translateX(0)' },
    },
    slideInUp: {
      from: { transform: 'translateY(100%)' },
      to: { transform: 'translateY(0)' },
    },
    slideInDown: {
      from: { transform: 'translateY(-100%)' },
      to: { transform: 'translateY(0)' },
    },
    zoomIn: {
      from: { transform: 'scale(0)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
    zoomOut: {
      from: { transform: 'scale(1)', opacity: 1 },
      to: { transform: 'scale(0)', opacity: 0 },
    },
    flipInX: {
      from: { transform: 'perspective(400px) rotateX(90deg)', opacity: 0 },
      to: { transform: 'perspective(400px) rotateX(0deg)', opacity: 1 },
    },
    flipInY: {
      from: { transform: 'perspective(400px) rotateY(90deg)', opacity: 0 },
      to: { transform: 'perspective(400px) rotateY(0deg)', opacity: 1 },
    },
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  modal: '1000',
  popover: '1010',
  tooltip: '1020',
  notification: '1030',
  dropdown: '1040',
  overlay: '1050',
};

// Component-specific tokens
export const components = {
  button: {
    sizes: {
      sm: {
        padding: `${spacing[2]} ${spacing[3]}`,
        fontSize: typography.fontSize.sm[0],
        borderRadius: borderRadius.md,
      },
      md: {
        padding: `${spacing[2.5]} ${spacing[4]}`,
        fontSize: typography.fontSize.base[0],
        borderRadius: borderRadius.lg,
      },
      lg: {
        padding: `${spacing[3]} ${spacing[6]}`,
        fontSize: typography.fontSize.lg[0],
        borderRadius: borderRadius.xl,
      },
    },
    variants: {
      primary: {
        background: colors.primary[500],
        color: 'white',
        boxShadow: shadows.colored.blue,
        '&:hover': {
          background: colors.primary[600],
          transform: 'translateY(-1px)',
        },
      },
      secondary: {
        background: colors.glass.white,
        color: colors.gray[700],
        backdropFilter: 'blur(10px)',
        border: `1px solid ${colors.gray[200]}`,
        '&:hover': {
          background: colors.gray[50],
        },
      },
    },
  },
  
  card: {
    base: {
      background: colors.glass.white,
      backdropFilter: 'blur(16px)',
      borderRadius: borderRadius['2xl'],
      border: `1px solid ${colors.gray[200]}`,
      boxShadow: shadows.glass.light,
      padding: spacing[6],
    },
    variants: {
      elevated: {
        boxShadow: shadows.xl,
        transform: 'translateY(0)',
        transition: 'all 300ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: shadows['2xl'],
        },
      },
    },
  },
  
  input: {
    base: {
      padding: `${spacing[3]} ${spacing[4]}`,
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.gray[300]}`,
      fontSize: typography.fontSize.base[0],
      lineHeight: typography.lineHeight.normal,
      transition: 'all 150ms ease',
      '&:focus': {
        outline: 'none',
        borderColor: colors.primary[500],
        boxShadow: `0 0 0 3px ${colors.primary[500]}20`,
      },
    },
  },
};

// Utility functions
export const getSpacing = (value: keyof typeof spacing) => spacing[value];
export const getColor = (path: string) => {
  const keys = path.split('.');
  let result: any = colors;
  for (const key of keys) {
    result = result[key];
  }
  return result;
};

export const getAnimation = (name: string) => {
  return animations.presets[name as keyof typeof animations.presets];
};

export const getShadow = (name: string) => {
  const keys = name.split('.');
  let result: any = shadows;
  for (const key of keys) {
    result = result[key];
  }
  return result;
};

// CSS Custom Properties Generator
export const generateCSSCustomProperties = () => {
  const customProperties: Record<string, string> = {};
  
  // Colors
  Object.entries(colors).forEach(([category, values]) => {
    if (typeof values === 'object' && values !== null) {
      Object.entries(values).forEach(([shade, value]) => {
        if (typeof value === 'string') {
          customProperties[`--color-${category}-${shade}`] = value;
        } else if (typeof value === 'object') {
          Object.entries(value).forEach(([subShade, subValue]) => {
            customProperties[`--color-${category}-${shade}-${subShade}`] = subValue as string;
          });
        }
      });
    }
  });
  
  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    customProperties[`--spacing-${key}`] = value;
  });
  
  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    if (typeof value === 'string') {
      customProperties[`--shadow-${key}`] = value;
    }
  });
  
  return customProperties;
};

export default {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  animations,
  breakpoints,
  zIndex,
  components,
  getSpacing,
  getColor,
  getAnimation,
  getShadow,
  generateCSSCustomProperties,
};