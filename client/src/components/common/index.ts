// Loading & Feedback
export { default as LoadingSpinner } from './LoadingSpinner';
export { 
  Skeleton, 
  CardSkeleton, 
  TableSkeleton, 
  ChartSkeleton, 
  PageSkeleton, 
  PulseLoader, 
  ProgressBar 
} from './EnhancedLoading';
export { default as ButtonLoader } from './ButtonLoader';
export { default as AutoSaveIndicator, useAutoSave } from './AutoSaveIndicator';

// Transitions & Animations
export { 
  default as PageTransition, 
  StaggeredList, 
  FadeTransition, 
  ScaleTransition, 
  SlideTransition 
} from './PageTransition';
export {
  AnimatedCounter,
  ProgressIndicator,
  HoverCard,
  FadeIn,
  PulseAnimation,
  SuccessAnimation,
  BouncingDots,
  FloatingParticles,
  GlowEffect,
} from './MicroInteractions';

// Status & Notifications
export { default as ConnectionStatus, ConnectionIndicator } from './ConnectionStatus';
export { default as NotificationCenter } from './NotificationCenter';
export type { Notification } from './NotificationCenter';
export { ToastProvider, useToast } from './Toast';

// Empty States
export { 
  default as EmptyState,
  NoSearchResults,
  NoDataYet,
  NoStudents,
  NoCourses,
  NoAttendance,
  NoSchedule,
} from './EmptyState';

// Navigation & Layout
export { default as Breadcrumb } from './Breadcrumb';
export { default as Sidebar } from './Sidebar';
export { default as Navbar } from './Navbar';
export { default as Layout } from './Layout';

// Forms & Inputs
export { default as ProgressSteps, ProgressBarSteps } from './ProgressSteps';
export { default as ConfirmDialog, useConfirmDialog } from './ConfirmDialog';

// Data Display
export { default as StatsCard, GradientStatsCard } from './StatsCard';
export { 
  ResponsiveTable, 
  TouchFriendlyButton, 
  MobileMenu, 
  SwipeableCard, 
  FloatingActionButton, 
  PullToRefresh 
} from './MobileOptimized';

// Error Handling
export { default as ErrorBoundary } from './ErrorBoundary';
