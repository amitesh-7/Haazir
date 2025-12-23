import React from 'react';

interface Step {
  id: string | number;
  title: string;
  description?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStep,
  onStepClick,
  variant = 'horizontal',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: { circle: 'w-8 h-8 text-sm', line: 'h-0.5', text: 'text-xs' },
    md: { circle: 'w-10 h-10 text-base', line: 'h-1', text: 'text-sm' },
    lg: { circle: 'w-12 h-12 text-lg', line: 'h-1', text: 'text-base' },
  };

  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  if (variant === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isClickable = onStepClick && index <= currentStep;

          return (
            <div key={step.id} className="flex gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={`
                    ${sizeClasses[size].circle} rounded-full flex items-center justify-center font-semibold
                    transition-all duration-300 ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                    ${status === 'completed' ? 'bg-green-500 text-white' : ''}
                    ${status === 'current' ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                    ${status === 'upcoming' ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {status === 'completed' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[40px] mt-2 ${
                    status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>

              {/* Step content */}
              <div className="pb-8">
                <p className={`font-medium ${status === 'current' ? 'text-blue-600' : 'text-gray-900'} ${sizeClasses[size].text}`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-gray-500 text-sm mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isClickable = onStepClick && index <= currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`
                  ${sizeClasses[size].circle} rounded-full flex items-center justify-center font-semibold
                  transition-all duration-300 ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                  ${status === 'completed' ? 'bg-green-500 text-white' : ''}
                  ${status === 'current' ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                  ${status === 'upcoming' ? 'bg-gray-200 text-gray-500' : ''}
                `}
              >
                {status === 'completed' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </button>
              <div className="mt-2 text-center">
                <p className={`font-medium ${status === 'current' ? 'text-blue-600' : 'text-gray-900'} ${sizeClasses[size].text}`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-gray-500 text-xs mt-0.5 max-w-[100px]">{step.description}</p>
                )}
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={`flex-1 mx-4 ${sizeClasses[size].line} rounded-full transition-colors duration-300 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Compact progress bar variant
interface ProgressBarStepsProps {
  totalSteps: number;
  currentStep: number;
  showLabels?: boolean;
  className?: string;
}

export const ProgressBarSteps: React.FC<ProgressBarStepsProps> = ({
  totalSteps,
  currentStep,
  showLabels = true,
  className = '',
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={className}>
      {showLabels && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
        </div>
      )}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressSteps;
