import { useTheme as useThemeContext } from '../contexts/ThemeContext';

export { useThemeContext as useTheme };

// Additional theme utilities
export const getThemeColors = (theme: 'light' | 'dark') => {
  const colors = {
    light: {
      primary: '#6366f1',
      primaryDark: '#4f46e5',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#ffffff',
      surface: '#f8fafc',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      border: '#e2e8f0',
    },
    dark: {
      primary: '#818cf8',
      primaryDark: '#6366f1',
      secondary: '#a78bfa',
      accent: '#22d3ee',
      background: '#0f172a',
      surface: '#1e293b',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      border: '#334155',
    },
  };
  
  return colors[theme];
};
