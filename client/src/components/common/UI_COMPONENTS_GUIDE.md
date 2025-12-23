# UI/UX Enhancement Components Guide

## Quick Import
```tsx
import {
  ButtonLoader,
  PageTransition,
  StaggeredList,
  ConnectionStatus,
  EmptyState,
  AutoSaveIndicator,
  useAutoSave,
  NotificationCenter,
  ProgressSteps,
  ConfirmDialog,
  useConfirmDialog,
  StatsCard,
  GradientStatsCard,
} from '../components/common';
```

---

## 1. ButtonLoader
Buttons with built-in loading states.

```tsx
<ButtonLoader
  loading={isSubmitting}
  onClick={handleSubmit}
  variant="primary" // primary | secondary | success | danger | warning | ghost
  size="md" // xs | sm | md | lg
  loadingText="Saving..."
>
  Save Changes
</ButtonLoader>
```

---

## 2. Page Transitions
Smooth animations when content loads.

```tsx
// Wrap your page content
<PageTransition>
  <YourPageContent />
</PageTransition>

// Staggered list items
<StaggeredList staggerDelay={100}>
  {items.map(item => <Card key={item.id} {...item} />)}
</StaggeredList>

// Fade transition for modals
<FadeTransition show={isOpen}>
  <Modal />
</FadeTransition>

// Slide transition for sidebars
<SlideTransition show={isOpen} direction="right">
  <Sidebar />
</SlideTransition>
```

---

## 3. Connection Status
Shows online/offline status banner.

```tsx
// Add to App.tsx or Layout
<ConnectionStatus showOnlineMessage={true} onlineDuration={3000} />

// Compact indicator
<ConnectionIndicator />
```

---

## 4. Empty States
Beautiful empty states with actions.

```tsx
// Generic
<EmptyState
  icon="data" // search | data | error | success | calendar | users | courses | attendance
  title="No data found"
  description="Get started by adding your first item."
  action={{ label: "Add Item", onClick: handleAdd }}
/>

// Presets
<NoSearchResults query={searchQuery} onClear={() => setQuery('')} />
<NoStudents onAdd={() => navigate('/add-student')} />
<NoCourses onAdd={() => navigate('/add-course')} />
<NoAttendance onTake={() => navigate('/take-attendance')} />
<NoSchedule />
```

---

## 5. Auto-Save Indicator
Shows save status for forms.

```tsx
const { status, lastSaved, save, retry } = useAutoSave(
  async () => await api.saveData(formData),
  1000 // debounce ms
);

// Trigger save on change
useEffect(() => { save(); }, [formData]);

// Show indicator
<AutoSaveIndicator
  status={status}
  lastSaved={lastSaved}
  onRetry={retry}
/>
```

---

## 6. Notification Center
Dropdown notification panel.

```tsx
const [notifications, setNotifications] = useState<Notification[]>([]);

<NotificationCenter
  notifications={notifications}
  onMarkAsRead={(id) => markAsRead(id)}
  onMarkAllAsRead={() => markAllAsRead()}
  onClear={(id) => clearNotification(id)}
  onClearAll={() => clearAll()}
/>
```

---

## 7. Progress Steps
Multi-step form progress.

```tsx
const steps = [
  { id: 1, title: 'Details', description: 'Basic info' },
  { id: 2, title: 'Settings', description: 'Configure' },
  { id: 3, title: 'Review', description: 'Confirm' },
];

<ProgressSteps
  steps={steps}
  currentStep={currentStep}
  onStepClick={(index) => setCurrentStep(index)}
  variant="horizontal" // horizontal | vertical
/>

// Compact progress bar
<ProgressBarSteps totalSteps={3} currentStep={1} />
```

---

## 8. Confirm Dialog
Confirmation modals with loading state.

```tsx
// Using hook
const { state, confirm, close } = useConfirmDialog();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Delete Item?',
    message: 'This action cannot be undone.',
    variant: 'danger', // danger | warning | info
  });
  if (confirmed) {
    await deleteItem();
  }
};

<ConfirmDialog
  isOpen={state.isOpen}
  onClose={close}
  onConfirm={state.onConfirm}
  title={state.title}
  message={state.message}
  variant={state.variant}
  loading={isDeleting}
/>
```

---

## 9. Stats Cards
Animated statistics cards.

```tsx
// Standard card
<StatsCard
  title="Total Students"
  value={248}
  icon={<UsersIcon />}
  trend={{ value: 12, isPositive: true }}
  subtitle="Active enrollments"
  color="blue" // blue | green | purple | orange | red | indigo
  animateValue={true}
/>

// Gradient variant
<GradientStatsCard
  title="Attendance Rate"
  value="94.2%"
  color="green"
  trend={{ value: 2.3, isPositive: true }}
/>
```

---

## CSS Animation Classes
Available in your stylesheets:

```css
.animate-fade-in       /* Fade in */
.animate-scale-in      /* Scale + fade */
.animate-slide-up      /* Slide up + fade */
.animate-slide-down    /* Slide down + fade */
.animate-bounce-in     /* Bouncy entrance */
.animate-shake         /* Error shake */
.animate-glow-pulse    /* Glowing effect */
.animate-floating      /* Floating up/down */
.skeleton-shimmer      /* Loading shimmer */
```

---

## Best Practices

1. **Always show loading states** - Use ButtonLoader for async actions
2. **Wrap pages in PageTransition** - Smooth route changes
3. **Use empty states** - Never show blank screens
4. **Add ConnectionStatus to layout** - Users know when offline
5. **Confirm destructive actions** - Use ConfirmDialog for deletes
6. **Animate numbers** - StatsCard animates values on scroll
