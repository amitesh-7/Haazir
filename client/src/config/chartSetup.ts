/**
 * Chart.js Configuration
 * 
 * This file registers all Chart.js components globally.
 * Import this file ONCE at the app entry point (index.tsx or App.tsx)
 * to ensure charts work across the application.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  TimeSeriesScale,
} from 'chart.js';

// Register ALL Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  TimeSeriesScale
);

// Default global configuration
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;
ChartJS.defaults.plugins.legend.display = true;
ChartJS.defaults.plugins.tooltip.enabled = true;

// Default font settings
ChartJS.defaults.font.family = "'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif";
ChartJS.defaults.font.size = 12;

// Default colors
ChartJS.defaults.color = '#6B7280'; // gray-500
ChartJS.defaults.borderColor = 'rgba(0, 0, 0, 0.1)';

export default ChartJS;
