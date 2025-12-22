import React from 'react';
import { Clock, CheckCircle, AlertCircle, Loader2, Layers, Cpu, Brain } from 'lucide-react';

interface GenerationProgressProps {
  isGenerating: boolean;
  progress: {
    stage: 'preparing' | 'validating' | 'generating' | 'merging' | 'completed' | 'error';
    method: 'csp' | 'ai' | 'hybrid' | 'auto';
    currentChunk?: number;
    totalChunks?: number;
    currentSection?: string;
    totalSections?: number;
    processedSections?: number;
    estimatedTimeRemaining?: number;
    message?: string;
  };
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({ isGenerating, progress }) => {
  if (!isGenerating) return null;

  const getStageInfo = () => {
    switch (progress.stage) {
      case 'preparing':
        return {
          title: 'Preparing Data',
          description: 'Organizing sections, teachers, and constraints...',
          icon: Layers,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
        };
      case 'validating':
        return {
          title: 'Validating Constraints',
          description: 'Checking for conflicts and feasibility...',
          icon: CheckCircle,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50',
        };
      case 'generating':
        return {
          title: progress.method === 'ai' || progress.method === 'hybrid' 
            ? 'AI Processing' 
            : 'CSP Solving',
          description: progress.method === 'ai' || progress.method === 'hybrid'
            ? 'Generating optimal schedule with AI...'
            : 'Running constraint satisfaction solver...',
          icon: progress.method === 'ai' || progress.method === 'hybrid' ? Brain : Cpu,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
        };
      case 'merging':
        return {
          title: 'Merging Results',
          description: 'Combining chunk results and resolving conflicts...',
          icon: Layers,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
        };
      case 'completed':
        return {
          title: 'Completed',
          description: 'Timetable generated successfully!',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      case 'error':
        return {
          title: 'Error',
          description: progress.message || 'An error occurred during generation',
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
        };
      default:
        return {
          title: 'Processing',
          description: 'Working on your timetable...',
          icon: Loader2,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const stageInfo = getStageInfo();
  const Icon = stageInfo.icon;

  // Calculate overall progress percentage
  const getProgressPercentage = (): number => {
    if (progress.stage === 'completed') return 100;
    if (progress.stage === 'error') return 0;
    
    const stageWeights: Record<string, number> = {
      preparing: 10,
      validating: 20,
      generating: 70,
      merging: 95,
    };

    let baseProgress = stageWeights[progress.stage] || 0;
    
    // Add chunk progress if generating
    if (progress.stage === 'generating' && progress.totalChunks && progress.currentChunk) {
      const chunkProgress = (progress.currentChunk / progress.totalChunks) * 50;
      baseProgress = 20 + chunkProgress;
    }

    return Math.min(baseProgress, 99);
  };

  const progressPercentage = getProgressPercentage();

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className={`rounded-lg border ${stageInfo.bgColor} border-opacity-50 p-4 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white shadow-sm`}>
            {progress.stage === 'generating' || progress.stage === 'preparing' || progress.stage === 'validating' ? (
              <Loader2 className={`w-5 h-5 ${stageInfo.color} animate-spin`} />
            ) : (
              <Icon className={`w-5 h-5 ${stageInfo.color}`} />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{stageInfo.title}</h4>
            <p className="text-sm text-gray-600">{stageInfo.description}</p>
          </div>
        </div>
        
        {progress.estimatedTimeRemaining && progress.stage !== 'completed' && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>~{formatTime(progress.estimatedTimeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {progress.currentChunk && progress.totalChunks
              ? `Chunk ${progress.currentChunk} of ${progress.totalChunks}`
              : progress.processedSections && progress.totalSections
              ? `${progress.processedSections} of ${progress.totalSections} sections`
              : 'Processing...'}
          </span>
          <span className="font-medium text-gray-900">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress.stage === 'error'
                ? 'bg-red-500'
                : progress.stage === 'completed'
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Current Section Info */}
      {progress.currentSection && (
        <div className="text-sm text-gray-600 bg-white/50 rounded px-3 py-2">
          <span className="font-medium">Current: </span>
          {progress.currentSection}
        </div>
      )}

      {/* Stage Indicators */}
      <div className="flex items-center justify-between pt-2">
        {['preparing', 'validating', 'generating', 'merging', 'completed'].map((stage, idx) => {
          const stages = ['preparing', 'validating', 'generating', 'merging', 'completed'];
          const currentIdx = stages.indexOf(progress.stage);
          const isComplete = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          
          return (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isComplete
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white animate-pulse'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isComplete ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-xs mt-1 ${isCurrent ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </span>
              </div>
              {idx < 4 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${
                    idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Method Badge */}
      <div className="flex items-center justify-center pt-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          progress.method === 'ai' ? 'bg-green-100 text-green-700' :
          progress.method === 'csp' ? 'bg-blue-100 text-blue-700' :
          progress.method === 'hybrid' ? 'bg-orange-100 text-orange-700' :
          'bg-purple-100 text-purple-700'
        }`}>
          {progress.method === 'ai' ? 'AI Generation' :
           progress.method === 'csp' ? 'CSP Solver' :
           progress.method === 'hybrid' ? 'Hybrid Mode' :
           'Auto Select'}
        </span>
      </div>
    </div>
  );
};

export default GenerationProgress;
