import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  UserCheck,
  AlertTriangle,
  UserX,
  RefreshCw,
} from "lucide-react";
import { api } from "../../services/api";

interface VerificationResult {
  classPhotoId: string;
  totalFacesDetected: number;
  verifiedStudents: number;
  suspiciousStudents: number;
  unknownFaces: number;
  processingTimeMs: number;
  verified: Array<{
    studentId: number;
    studentName: string;
    similarity: string;
  }>;
  suspicious: Array<{
    studentId: number;
    studentName: string;
    reason: string;
  }>;
  outputImage?: string;
}

interface ClassPhotoVerificationProps {
  sessionId: string;
  onComplete: (result: VerificationResult) => void;
  onBack?: () => void;
}

/**
 * Teacher Class Photo Verification Component
 * Uses RetinaFace API for multi-face detection and matching
 */
const ClassPhotoVerification: React.FC<ClassPhotoVerificationProps> = ({
  sessionId,
  onComplete,
  onBack,
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<"webcam" | "upload" | null>(
    null
  );

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment", // Use back camera for class photos
  };

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
      setResult(null);
      setError(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if (!image) {
      setError("Please capture or upload an image first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const imageBase64 = image.split(",")[1];

      const response = await api.post(
        "/smart-attendance/dual-verify/class-photo",
        {
          sessionId,
          imageBase64,
        }
      );

      if (response.data.success) {
        setResult(response.data.data);
        onComplete(response.data.data);
      } else {
        setError(response.data.error || "Verification failed");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetCapture = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setCaptureMode(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            🎓 Verify Class Attendance
          </h2>
          <p className="text-gray-600">
            Capture a photo of the class to verify attendance
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Capture Mode Selection */}
      {!captureMode && !image && (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">
            How would you like to capture the class photo?
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => setCaptureMode("webcam")}
              className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <Camera className="w-12 h-12 text-blue-500" />
              <span className="font-medium text-gray-800">Use Camera</span>
              <span className="text-sm text-gray-500">
                Take photo with webcam
              </span>
            </button>
            <button
              onClick={() => {
                setCaptureMode("upload");
                fileInputRef.current?.click();
              }}
              className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <Upload className="w-12 h-12 text-green-500" />
              <span className="font-medium text-gray-800">Upload Photo</span>
              <span className="text-sm text-gray-500">Select from device</span>
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
        </div>
      )}

      {/* Webcam Capture */}
      {captureMode === "webcam" && !image && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="relative rounded-lg overflow-hidden shadow-md mb-4 bg-gray-900">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.9}
              videoConstraints={videoConstraints}
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={resetCapture}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCapture}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              <Camera className="w-5 h-5" />
              Capture Photo
            </button>
          </div>
        </div>
      )}

      {/* Image Preview (before verification) */}
      {image && !result && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Preview Class Photo
          </h3>
          <div className="rounded-lg overflow-hidden shadow-md mb-4">
            <img
              src={image}
              alt="Class photo"
              className="w-full h-auto max-h-96 object-contain bg-gray-100"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={resetCapture}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
              Retake
            </button>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verify Attendance
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ✅ Verification Results
          </h3>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {result.totalFacesDetected}
              </div>
              <div className="text-sm text-gray-600">Faces Detected</div>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {result.verifiedStudents}
              </div>
              <div className="text-sm text-gray-600">Verified ✅</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-xl text-center">
              <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">
                {result.suspiciousStudents}
              </div>
              <div className="text-sm text-gray-600">Suspicious ⚠️</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl text-center">
              <UserX className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-600">
                {result.unknownFaces}
              </div>
              <div className="text-sm text-gray-600">Unknown</div>
            </div>
          </div>

          {/* Output Image with Bounding Boxes */}
          {result.outputImage && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-2">
                Detected Faces:
              </h4>
              <div className="rounded-lg overflow-hidden shadow-md">
                <img
                  src={`data:image/jpeg;base64,${result.outputImage}`}
                  alt="Detected faces"
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}

          {/* Verified Students List */}
          {result.verified.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Verified Students ({result.verified.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.verified.map((v, i) => (
                  <div
                    key={i}
                    className="bg-green-50 px-4 py-2 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">
                      {v.studentName}
                    </span>
                    <span className="text-green-600 font-semibold text-sm">
                      {v.similarity} match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suspicious Students List */}
          {result.suspicious.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Suspicious Students ({result.suspicious.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.suspicious.map((s, i) => (
                  <div
                    key={i}
                    className="bg-red-50 px-4 py-2 rounded-lg flex justify-between items-center"
                  >
                    <span className="font-medium text-gray-800">
                      {s.studentName}
                    </span>
                    <span className="text-red-600 text-sm">{s.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Info */}
          <div className="text-sm text-gray-500 text-right border-t pt-4">
            Processed in {result.processingTimeMs}ms
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={resetCapture}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Take Another Photo
            </button>
            <button
              onClick={() => onComplete(result)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Complete Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassPhotoVerification;
