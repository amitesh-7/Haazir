import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "../../services/api";

interface SelfVerificationProps {
  sessionId: string;
  studentId: number;
  studentName?: string;
  onSuccess: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * Student Self-Verification Component
 * Uses RetinaFace API for face verification
 */
const SelfVerification: React.FC<SelfVerificationProps> = ({
  sessionId,
  studentId,
  studentName,
  onSuccess,
  onError,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
  };

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setError(null);
      setSuccess(null);
    } else {
      setError("Failed to capture image. Please try again.");
    }
  }, []);

  const retake = () => {
    setCapturedImage(null);
    setError(null);
    setSuccess(null);
    setVerificationResult(null);
  };

  const submitVerification = async () => {
    if (!capturedImage) {
      setError("Please capture an image first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Remove data URI prefix
      const imageBase64 = capturedImage.split(",")[1];

      const response = await api.post(
        "/smart-attendance/dual-verify/self-verify",
        {
          sessionId,
          studentId,
          imageBase64,
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message || "Verification successful!");
        setVerificationResult(response.data.data);
        onSuccess(response.data.data);
      } else {
        const errorMsg = response.data.error || "Verification failed";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || "Verification failed. Please try again.";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          📸 Face Verification
        </h2>
        <p className="text-gray-600">
          {studentName ? `Hello, ${studentName}!` : ""} Position your face in
          the camera and click capture.
        </p>
      </div>

      {/* Camera/Preview Section */}
      <div className="relative rounded-lg overflow-hidden shadow-md mb-4 bg-gray-900">
        {!capturedImage ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.9}
            videoConstraints={videoConstraints}
            className="w-full h-auto"
            mirrored={true}
          />
        ) : (
          <img
            src={capturedImage}
            alt="Captured selfie"
            className="w-full h-auto"
          />
        )}

        {/* Face guide overlay */}
        {!capturedImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-64 border-4 border-dashed border-white/50 rounded-full" />
          </div>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">
            ✅ Verified Successfully
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              Status:{" "}
              <span className="font-medium">{verificationResult.status}</span>
            </p>
            <p>
              Match:{" "}
              <span className="font-medium">
                {verificationResult.similarity}
              </span>
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Waiting for teacher to verify class photo...
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!capturedImage ? (
          <button
            onClick={captureImage}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            Capture
          </button>
        ) : !verificationResult ? (
          <>
            <button
              onClick={retake}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
              Retake
            </button>
            <button
              onClick={submitVerification}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verify
                </>
              )}
            </button>
          </>
        ) : (
          <div className="flex-1 text-center py-3 text-gray-600">
            Verification complete! ✅
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-sm text-gray-500">
        <h4 className="font-medium text-gray-700 mb-2">
          Tips for best results:
        </h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Ensure good lighting on your face</li>
          <li>Look directly at the camera</li>
          <li>Remove glasses if possible</li>
          <li>Keep a neutral expression</li>
        </ul>
      </div>
    </div>
  );
};

export default SelfVerification;
