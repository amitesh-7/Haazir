import React, { useState, useEffect } from "react";
import { Clock, MapPin, RefreshCw, ArrowRight } from "lucide-react";

interface TimetableSlot {
  schedule_id: number;
  course_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  classroom?: string;
}

interface SessionData {
  sessionId: string;
  scheduleId: number;
  status: string;
  expiresAt: string;
  isExpired: boolean;
  qrCodeUrl?: string;
  scans?: {
    total: number;
    verified: number;
  };
}

interface QRDisplayProps {
  sessionData: SessionData;
  selectedSlot: TimetableSlot;
  onStartMonitoring: () => void;
}

const QRDisplay: React.FC<QRDisplayProps> = ({
  sessionData,
  selectedSlot,
  onStartMonitoring,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Check if sessionData is valid and has QR code URL
    if (!sessionData?.sessionId) {
      return;
    }

    // Use the QR code URL from sessionData if available
    if (sessionData.qrCodeUrl) {
      console.log("📱 Setting QR Code URL:", sessionData.qrCodeUrl);
      setQrCodeUrl(sessionData.qrCodeUrl);
    }
  }, [sessionData.sessionId, sessionData.qrCodeUrl]);

  // Update countdown timer
  useEffect(() => {
    // Check if sessionData is valid
    if (!sessionData?.expiresAt) {
      return;
    }

    console.log("⏰ QRDisplay - Expires At:", sessionData.expiresAt);
    console.log("⏰ QRDisplay - Current Time:", new Date().toISOString());
    console.log(
      "⏰ QRDisplay - Expiry Time:",
      new Date(sessionData.expiresAt).toISOString()
    );

    const now = new Date().getTime();
    const expiry = new Date(sessionData.expiresAt).getTime();
    const initialRemaining = Math.max(0, Math.floor((expiry - now) / 1000));

    console.log(
      "⏰ QRDisplay - Initial Time Remaining (seconds):",
      initialRemaining
    );
    setTimeRemaining(initialRemaining);

    if (initialRemaining === 0) {
      setIsExpired(true);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(sessionData.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionData.expiresAt]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Safety check: if sessionData or selectedSlot is invalid, show error
  if (!sessionData || !selectedSlot) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-semibold">
            Error: Missing session or slot data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            QR Code Generated
          </h2>
          <p className="text-gray-600">
            Students can now scan this QR code to mark attendance
          </p>
        </div>

        {/* Class Information */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-xl text-blue-800 mb-3">
            {selectedSlot.course_name}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-700">
              <Clock size={16} className="mr-2" />
              <span>
                {selectedSlot.start_time} - {selectedSlot.end_time}
              </span>
            </div>
            {selectedSlot.classroom && (
              <div className="flex items-center text-gray-700">
                <MapPin size={16} className="mr-2" />
                <span>Room: {selectedSlot.classroom}</span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col items-center mb-6">
          {/* Timer Display - ABOVE QR Code */}
          <div
            className={`mb-4 px-6 py-3 rounded-full font-bold text-xl shadow-lg ${
              isExpired
                ? "bg-red-500 text-white"
                : timeRemaining < 120
                ? "bg-yellow-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {isExpired ? (
              <span className="flex items-center">
                <Clock size={20} className="inline mr-2" />
                EXPIRED
              </span>
            ) : (
              <span className="flex items-center">
                <Clock size={20} className="inline mr-2" />
                {formatTime(timeRemaining)}
              </span>
            )}
          </div>

          {/* QR Code Display - NO OVERLAYS */}
          <div className="w-96 h-96 bg-white border-8 border-gray-800 rounded-lg flex items-center justify-center shadow-2xl">
            <div className="text-center">
              <div className="w-80 h-80 bg-white rounded flex items-center justify-center">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code for Attendance"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">
                      Generating QR Code...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Session ID - BELOW QR Code */}
          <p className="text-sm text-gray-600 mt-4 font-mono">
            Session: {sessionData?.sessionId?.slice(0, 16) || "N/A"}...
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <h4 className="font-bold text-yellow-800 mb-2">Instructions:</h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Display this QR code to students (projector/screen)</li>
            <li>Students must be within 100m radius to scan</li>
            <li>
              Students will verify their face after scanning (10s timeout)
            </li>
            <li>Monitor scans in real-time on next page</li>
            <li>Capture class photo for anti-proxy verification</li>
            <li>Finalize attendance after cross-verification</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {isExpired ? (
            <>
              <button
                onClick={handleRefresh}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center space-x-2"
              >
                <RefreshCw size={20} />
                <span>Generate New QR</span>
              </button>
              <button
                onClick={onStartMonitoring}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-2"
              >
                <span>Proceed to Monitoring</span>
                <ArrowRight size={20} />
              </button>
            </>
          ) : (
            <button
              onClick={onStartMonitoring}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-2"
            >
              <span>Start Monitoring Scans</span>
              <ArrowRight size={20} />
            </button>
          )}
        </div>

        {/* QR Code Info */}
        <div className="mt-6 text-center text-sm text-gray-600 bg-blue-50 rounded-lg p-4">
          <p className="font-semibold mb-1">
            ✅ QR Code valid for 60 seconds from generation
          </p>
          <p>⏱️ Face verification timeout: 60 seconds</p>
          <p className="mt-2">
            📱 Students must have registered their face before scanning
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRDisplay;
