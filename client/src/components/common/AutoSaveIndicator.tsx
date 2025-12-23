import React from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSaved,
  errorMessage,
  onRetry,
  className = '',
}) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statusConfig = {
    idle: {
      icon: null,
      text: lastSaved ? `Last saved ${formatTime(lastSaved)}` : '',
      color: 'text-gray-400',
    },
    saving: {
      icon: (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ),
      text: 'Saving...',
      color: 'text-blue-500',
    },
    saved: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ),
      text: 'Saved',
      color: 'text-green-500',
    },
    error: {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: errorMessage || 'Failed to save',
      color: 'text-red-500',
    },
  };

  const config = statusConfig[status];

  if (status === 'idle' && !lastSaved) return null;

  return (
    <div className={`flex items-center gap-2 text-sm ${config.color} ${className}`}>
      {config.icon}
      <span>{config.text}</span>
      {status === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="ml-1 underline hover:no-underline"
        >
          Retry
        </button>
      )}
    </div>
  );
};

// Hook for managing auto-save state
export const useAutoSave = (
  saveFunction: () => Promise<void>,
  debounceMs: number = 1000
) => {
  const [status, setStatus] = React.useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = React.useState<Date | undefined>();
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>();
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const save = React.useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setStatus('saving');
      try {
        await saveFunction();
        setStatus('saved');
        setLastSaved(new Date());
        setErrorMessage(undefined);
        
        // Reset to idle after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.message || 'Failed to save');
      }
    }, debounceMs);
  }, [saveFunction, debounceMs]);

  const retry = React.useCallback(async () => {
    setStatus('saving');
    try {
      await saveFunction();
      setStatus('saved');
      setLastSaved(new Date());
      setErrorMessage(undefined);
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Failed to save');
    }
  }, [saveFunction]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { status, lastSaved, errorMessage, save, retry };
};

export default AutoSaveIndicator;
