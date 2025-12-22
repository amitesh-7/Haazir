import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
} from "lucide-react";
import { api } from "../../services/api";

interface FaceRegistrationRetinaFaceProps {
  studentId: number;
  onComplete: () => void;
}

/**
 * Face Registration Component using RetinaFace API
 *
 * This component captures student face images and sends them to the backend
 * which uses the RetinaFace API to extract 512-dimensional face embeddings.
 *
 * Benefits over face-api.js:
 * - No need to load 50MB+ of models in the browser
 * - Faster face detection (GPU-accelerated on server)
 * - Higher quality 512D embeddings vs 128D from face-api.js
 * - Consistent processing across all devices
 */
const FaceRegistrationRetinaFace: React.FC<FaceRegistrationRetinaFaceProps> = ({
  studentId,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [registeredFaces, setRegisteredFaces] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  const webcamRef = useRef<Webcam>(null);

  const faceAngles = [
    "Face Forward (Center)",
    "Turn Slightly Left",
    "Turn Slightly Right",
    "Tilt Head Up Slightly",
    "Tilt Head Down Slightly",
  ];

  // Check RetinaFace API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.get("/smart-attendance/dual-verify/health");
        setApiHealthy(response.data.retinaFaceApi?.available || false);
      } catch (err) {
        console.error("Error checking RetinaFace API health:", err);
        setApiHealthy(false);
      }
    };
    checkHealth();
  }, []);

  // Fetch existing registered faces count
  useEffect(() => {
    const fetchRegisteredFaces = async () => {
      try {
        const response = await api.get(
          `/smart-attendance/student/${studentId}/faces`
        );
        setRegisteredFaces(response.data.totalFaces || 0);
      } catch (err) {
        console.error("Error fetching registered faces:", err);
      }
    };
    fetchRegisteredFaces();
  }, [studentId]);

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setError("");
      setSuccess("");
    } else {
      setError("Failed to capture image. Please try again.");
    }
  }, []);

  const retake = () => {
    setCapturedImage(null);
    setError("");
    setSuccess("");
  };

  const submitRegistration = async () => {
    if (!capturedImage) {
      setError("Please capture an image first");
      return;
    }

    setIsCapturing(true);
    setError("");
    setSuccess("");

    try {
      // Remove data URI prefix and send to backend
      // Backend will call RetinaFace API to extract embeddings
      const imageBase64 = capturedImage.split(",")[1];

      const response = await api.post("/smart-attendance/register-face", {
        studentId,
        imageBase64,
      });

      if (response.data.face) {
        setSuccess(
          `Face ${currentStep + 1}/5 registered successfully! ` +
            `(${response.data.face.embeddingDimension}D embedding, ` +
            `confidence: ${(response.data.face.confidence * 100).toFixed(1)}%)`
        );
        setRegisteredFaces(response.data.totalRegisteredFaces);

        // Move to next step or complete
        if (currentStep < 4) {
          setTimeout(() => {
            setCurrentStep(currentStep + 1);
            setCapturedImage(null);
            setSuccess("");
          }, 2000);
        } else {
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error("Error registering face:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to register face. Please try again.";
      setError(errorMsg);
    } finally {
      setIsCapturing(false);
    }
  };

  // Show loading while checking API
  if (apiHealthy === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Connecting to face recognition service...
          </p>
        </div>
      </div>
    );
  }

  // Show error if API is not available
  if (apiHealthy === false) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-800 mb-2">
            Face Recognition Service Unavailable
          </h2>
          <p className="text-red-600 mb-4">
            The RetinaFace API is currently not responding. Please try again
            later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4 inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-4">
          <User className="h-8 w-8 text-blue-500 mr-3" />
          <h2 className="text-3xl font-bold text-gray-800">
            Face Registration
          </h2>
        </div>

        <div className="flex items-center mb-6">
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            RetinaFace API Connected
          </div>
          <span className="ml-4 text-gray-600">
            Registered: {registeredFaces}/5
          </span>
        </div>

        <p className="text-gray-600 mb-6">
          Register 5 different angles of your face for better recognition
          accuracy. The system uses advanced AI to extract facial features.
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex gap-1 mb-2">
            {faceAngles.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded ${
                  index < currentStep
                    ? "bg-green-500"
                    : index === currentStep
                    ? "bg-blue-500"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Step {currentStep + 1} of 5 - {faceAngles[currentStep]}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h3 className="font-bold text-blue-800 mb-2">
            {faceAngles[currentStep]}
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ensure good lighting on your face</li>
            <li>• Keep your face in the center of the frame</li>
            <li>• Avoid wearing glasses or hats if possible</li>
            <li>• Stay still for a clear capture</li>
          </ul>
        </div>

        {/* Webcam / Captured Image */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured face"
                className="rounded-lg border-4 border-blue-400"
                style={{ width: 640, height: 480, objectFit: "cover" }}
              />
            ) : (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.9}
                className="rounded-lg border-4 border-gray-300"
                width={640}
                height={480}
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user",
                }}
              />
            )}
            {isCapturing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white text-center">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto mb-2" />
                  <p>Analyzing face with RetinaFace...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {capturedImage ? (
            <>
              <button
                onClick={retake}
                disabled={isCapturing}
                className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition flex items-center"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Retake
              </button>
              <button
                onClick={submitRegistration}
                disabled={isCapturing}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition flex items-center ${
                  isCapturing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Register Face
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={captureImage}
              className="px-8 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center"
            >
              <Camera className="h-5 w-5 mr-2" />
              Capture Face
            </button>
          )}
        </div>

        {/* Skip Button (only if already have some faces registered) */}
        {registeredFaces > 0 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={onComplete}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              Skip and use {registeredFaces} registered face(s)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceRegistrationRetinaFace;
