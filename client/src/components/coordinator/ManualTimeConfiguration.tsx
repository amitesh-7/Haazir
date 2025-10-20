import React, { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Coffee,
} from "lucide-react";

interface TimeConfig {
  startTime: string;
  endTime: string;
  classDuration: number; // minutes
  lunchBreak: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  workingDays: string[];
}

interface ManualTimeConfigurationProps {
  onConfigChange: (config: TimeConfig) => void;
  initialConfig?: Partial<TimeConfig>;
}

const ManualTimeConfiguration: React.FC<ManualTimeConfigurationProps> = ({
  onConfigChange,
  initialConfig,
}) => {
  const [config, setConfig] = useState<TimeConfig>({
    startTime: "08:00",
    endTime: "17:00",
    classDuration: 60, // 1 hour default
    lunchBreak: {
      enabled: true,
      startTime: "12:30",
      endTime: "13:30",
    },
    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    ...initialConfig,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  const [calculatedSlots, setCalculatedSlots] = useState<
    Array<{
      slotNumber: number;
      startTime: string;
      endTime: string;
      isBreak: boolean;
      label: string;
    }>
  >([]);

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  // Sync with initialConfig only on first mount (prevents flickering during typing)
  useEffect(() => {
    if (initialConfig && !isInitialized) {
      setConfig((prev) => ({
        ...prev,
        ...initialConfig,
      }));
      setIsInitialized(true);
    }
  }, [initialConfig, isInitialized]);

  // Calculate time slots based on configuration
  useEffect(() => {
    calculateTimeSlots();
  }, [config]);

  // Notify parent component of changes
  useEffect(() => {
    onConfigChange(config);
  }, [config, onConfigChange]);

  const calculateTimeSlots = () => {
    const slots: Array<{
      slotNumber: number;
      startTime: string;
      endTime: string;
      isBreak: boolean;
      label: string;
    }> = [];

    if (!config.startTime || !config.endTime || !config.classDuration) {
      setCalculatedSlots([]);
      return;
    }

    const startMinutes = timeStringToMinutes(config.startTime);
    const endMinutes = timeStringToMinutes(config.endTime);
    const lunchStartMinutes = config.lunchBreak.enabled
      ? timeStringToMinutes(config.lunchBreak.startTime)
      : null;
    const lunchEndMinutes = config.lunchBreak.enabled
      ? timeStringToMinutes(config.lunchBreak.endTime)
      : null;

    let currentMinutes = startMinutes;
    let slotNumber = 1;
    let lunchAdded = false;

    while (currentMinutes < endMinutes) {
      // Check if we've reached or passed lunch time and haven't added it yet
      if (
        config.lunchBreak.enabled &&
        !lunchAdded &&
        lunchStartMinutes !== null &&
        lunchEndMinutes !== null &&
        currentMinutes >= lunchStartMinutes
      ) {
        // Add lunch break
        slots.push({
          slotNumber: 0, // Special number for break
          startTime: minutesToTimeString(lunchStartMinutes),
          endTime: minutesToTimeString(lunchEndMinutes),
          isBreak: true,
          label: "Lunch Break",
        });

        lunchAdded = true;
        currentMinutes = lunchEndMinutes;
        continue;
      }

      const slotEndMinutes = currentMinutes + config.classDuration;

      // If this slot would overlap with lunch break, adjust it
      if (
        config.lunchBreak.enabled &&
        !lunchAdded &&
        lunchStartMinutes !== null &&
        lunchEndMinutes !== null &&
        currentMinutes < lunchStartMinutes &&
        slotEndMinutes > lunchStartMinutes
      ) {
        // Add shortened slot before lunch
        slots.push({
          slotNumber,
          startTime: minutesToTimeString(currentMinutes),
          endTime: minutesToTimeString(lunchStartMinutes),
          isBreak: false,
          label: `Class ${slotNumber}`,
        });
        slotNumber++;

        // Add lunch break
        slots.push({
          slotNumber: 0,
          startTime: minutesToTimeString(lunchStartMinutes),
          endTime: minutesToTimeString(lunchEndMinutes),
          isBreak: true,
          label: "Lunch Break",
        });

        lunchAdded = true;
        currentMinutes = lunchEndMinutes;
        continue;
      }

      // Add regular class slot
      if (slotEndMinutes <= endMinutes) {
        slots.push({
          slotNumber,
          startTime: minutesToTimeString(currentMinutes),
          endTime: minutesToTimeString(Math.min(slotEndMinutes, endMinutes)),
          isBreak: false,
          label: `Class ${slotNumber}`,
        });
        slotNumber++;
      }

      currentMinutes = slotEndMinutes;
    }

    setCalculatedSlots(slots);
  };

  const timeStringToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  const formatTimeFor12Hour = (timeString: string): string => {
    try {
      const time = new Date(`2000-01-01T${timeString}`);
      return time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  const updateConfig = (updates: Partial<TimeConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const toggleWorkingDay = (day: string) => {
    const newWorkingDays = config.workingDays.includes(day)
      ? config.workingDays.filter((d) => d !== day)
      : [...config.workingDays, day];

    updateConfig({ workingDays: newWorkingDays });
  };

  const isValidConfiguration = () => {
    if (!config.startTime || !config.endTime || !config.classDuration)
      return false;
    if (
      timeStringToMinutes(config.endTime) <=
      timeStringToMinutes(config.startTime)
    )
      return false;
    if (config.classDuration < 30 || config.classDuration > 240) return false;
    if (config.workingDays.length === 0) return false;

    if (config.lunchBreak.enabled) {
      const lunchStart = timeStringToMinutes(config.lunchBreak.startTime);
      const lunchEnd = timeStringToMinutes(config.lunchBreak.endTime);
      if (lunchEnd <= lunchStart) return false;
    }

    return true;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Clock className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Manual Time Configuration
        </h3>
      </div>

      {/* Basic Time Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Time
          </label>
          <input
            type="time"
            value={config.startTime}
            onChange={(e) => updateConfig({ startTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Time
          </label>
          <input
            type="time"
            value={config.endTime}
            onChange={(e) => updateConfig({ endTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class Duration (minutes)
          </label>
          <input
            type="number"
            min="30"
            max="240"
            step="15"
            value={config.classDuration}
            onChange={(e) =>
              updateConfig({ classDuration: parseInt(e.target.value) || 60 })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lunch Break Configuration */}
      <div className="bg-orange-50 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-4">
          <Coffee className="w-5 h-5 text-orange-600" />
          <h4 className="text-md font-medium text-gray-900">Lunch Break</h4>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.lunchBreak.enabled}
              onChange={(e) =>
                updateConfig({
                  lunchBreak: {
                    ...config.lunchBreak,
                    enabled: e.target.checked,
                  },
                })
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Enable lunch break</span>
          </label>
        </div>

        {config.lunchBreak.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lunch Start Time
              </label>
              <input
                type="time"
                value={config.lunchBreak.startTime}
                onChange={(e) =>
                  updateConfig({
                    lunchBreak: {
                      ...config.lunchBreak,
                      startTime: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lunch End Time
              </label>
              <input
                type="time"
                value={config.lunchBreak.endTime}
                onChange={(e) =>
                  updateConfig({
                    lunchBreak: {
                      ...config.lunchBreak,
                      endTime: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Working Days Selection */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Working Days</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {daysOfWeek.map((day) => (
            <button
              key={day.value}
              onClick={() => toggleWorkingDay(day.value)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                config.workingDays.includes(day.value)
                  ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
                  : "bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Time Slots Preview */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Generated Time Slots Preview
        </h4>

        {!isValidConfiguration() && (
          <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-md mb-3">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              Please complete the configuration to see time slots
            </span>
          </div>
        )}

        {isValidConfiguration() && calculatedSlots.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {calculatedSlots.map((slot, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 rounded-md text-sm ${
                    slot.isBreak
                      ? "bg-orange-100 text-orange-800 border border-orange-200"
                      : "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}
                >
                  <div className="font-medium">{slot.label}</div>
                  <div className="text-xs">
                    {formatTimeFor12Hour(slot.startTime)} -{" "}
                    {formatTimeFor12Hour(slot.endTime)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
              {calculatedSlots.filter((s) => !s.isBreak).length} class slots
              generated for {config.workingDays.length} working days
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualTimeConfiguration;
