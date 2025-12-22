import React, { useState, useEffect } from 'react';
import { Cpu, Brain, Zap, Settings, ChevronDown, ChevronUp, Info } from 'lucide-react';
import smartTimetableService from '../../services/smartTimetableService';

type GenerationMethod = 'csp' | 'ai' | 'hybrid' | 'auto';

interface GenerationMethodSelectorProps {
  selectedMethod: GenerationMethod;
  onMethodChange: (method: GenerationMethod) => void;
  sectionCount: number;
  isGenerating: boolean;
}

interface MethodInfo {
  id: GenerationMethod;
  name: string;
  icon: React.ElementType;
  description: string;
  features: string[];
  bestFor: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const METHODS: MethodInfo[] = [
  {
    id: 'auto',
    name: 'Auto Select',
    icon: Zap,
    description: 'Automatically choose the best method based on your data',
    features: [
      'Analyzes problem complexity',
      'Selects optimal algorithm',
      'Best for most users',
    ],
    bestFor: 'Recommended for all use cases',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
  },
  {
    id: 'csp',
    name: 'CSP Solver',
    icon: Cpu,
    description: 'Constraint Satisfaction Problem solver with advanced heuristics',
    features: [
      'AC-3 arc consistency',
      'MRV variable selection',
      'LCV value ordering',
      'Guaranteed valid solutions',
    ],
    bestFor: 'Small to medium timetables (< 15 sections)',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  {
    id: 'ai',
    name: 'AI Generation',
    icon: Brain,
    description: 'Google Gemini AI with multi-key parallel processing',
    features: [
      'Intelligent scheduling',
      'Natural constraint handling',
      'Multi-key load balancing',
      'Handles large datasets',
    ],
    bestFor: 'Large timetables (15+ sections)',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  {
    id: 'hybrid',
    name: 'Hybrid Mode',
    icon: Settings,
    description: 'Combines CSP and AI for best results',
    features: [
      'CSP for constraint satisfaction',
      'AI for optimization',
      'Multiple solution variants',
      'Best quality scores',
    ],
    bestFor: 'When you need the best possible results',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
  },
];

interface Capabilities {
  methods: {
    csp: { available: boolean };
    ai: { available: boolean };
    hybrid: { available: boolean };
    auto: { available: boolean };
  };
}

const GenerationMethodSelector: React.FC<GenerationMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  sectionCount,
  isGenerating,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        const result = await smartTimetableService.getGenerationCapabilities();
        if (result.success && result.data) {
          setCapabilities(result.data as Capabilities);
        }
      } catch (error) {
        console.error('Failed to fetch capabilities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCapabilities();
  }, []);

  const getRecommendedMethod = (): GenerationMethod => {
    if (sectionCount > 20) return 'ai';
    if (sectionCount > 10) return 'hybrid';
    return 'csp';
  };

  const isMethodAvailable = (methodId: GenerationMethod): boolean => {
    if (!capabilities) return true;
    return capabilities.methods[methodId]?.available ?? true;
  };

  const recommendedMethod = getRecommendedMethod();
  const selectedInfo = METHODS.find(m => m.id === selectedMethod)!;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className={`p-4 ${selectedInfo.bgColor} border-b ${selectedInfo.borderColor} cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white shadow-sm`}>
              <selectedInfo.icon className={`w-5 h-5 ${selectedInfo.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {selectedInfo.name}
                {selectedMethod === recommendedMethod && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    Recommended
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600">{selectedInfo.description}</p>
            </div>
          </div>
          <button className="p-1 hover:bg-white/50 rounded">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Options */}
      {expanded && (
        <div className="p-4">
          {/* Info Banner */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <strong>You have {sectionCount} section(s).</strong>
              {sectionCount > 20 && (
                <span> AI with multi-key processing is recommended for large datasets.</span>
              )}
              {sectionCount <= 10 && (
                <span> CSP solver will provide fast, reliable results.</span>
              )}
              {sectionCount > 10 && sectionCount <= 20 && (
                <span> Hybrid mode will give you the best quality results.</span>
              )}
            </div>
          </div>

          {/* Method Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {METHODS.map((method) => {
              const available = isMethodAvailable(method.id);
              const isSelected = selectedMethod === method.id;
              const isRecommended = method.id === recommendedMethod;
              const Icon = method.icon;

              return (
                <button
                  key={method.id}
                  onClick={() => available && onMethodChange(method.id)}
                  disabled={!available || isGenerating}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? `${method.bgColor} ${method.borderColor} ring-2 ring-offset-1 ring-${method.color.replace('text-', '')}`
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${
                    !available || isGenerating
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${method.bgColor}`}>
                      <Icon className={`w-5 h-5 ${method.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{method.name}</span>
                        {isRecommended && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            Best
                          </span>
                        )}
                        {!available && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{method.bestFor}</p>
                      
                      {/* Features list */}
                      <div className="mt-2 space-y-1">
                        {method.features.slice(0, 2).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                            <div className={`w-1 h-1 rounded-full ${method.color.replace('text-', 'bg-')}`} />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* API Keys Info */}
          {capabilities?.methods.ai?.available && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  AI Generation Available
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Multi-key processing enabled for large-scale generation (20-30+ sections)
              </p>
            </div>
          )}

          {!capabilities?.methods.ai?.available && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700 font-medium">
                  AI Generation Unavailable
                </span>
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Configure GEMINI_API_KEY in server .env to enable AI generation
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GenerationMethodSelector;
