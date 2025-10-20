import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import Webcam from "react-webcam";

interface FaceRegistrationProps {
  studentId: number;
  onComplete: () => void;
}

const FaceRegistration: React.FC<FaceRegistrationProps> = ({
  studentId,
  onComplete,
}) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [registeredFaces, setRegisteredFaces] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const webcamRef = useRef<Webcam>(null);

  const faceAngles = [
    "Face Forward (Center)",
    "Turn Slightly Left",
    "Turn Slightly Right",
    "Tilt Head Up Slightly",
    "Tilt Head Down Slightly",
  ];

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Initialize TensorFlow.js backend first
        await tf.ready();
        console.log("TensorFlow.js backend initialized");
        
        // Load face-api models
        const MODEL_URL = process.env.PUBLIC_URL + "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        
        setModelsLoaded(true);
        console.log("Face-api models loaded successfully");
      } catch (err) {
        console.error("Error loading face-api models:", err);
        setError(
          "Failed to load face detection models. Please refresh the page."
        );
      }
    };
    loadModels();
  }, []);

  // Fetch existing registered faces count
  useEffect(() => {
    const fetchRegisteredFaces = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(
          `${API_URL}/smart-attendance/student/${studentId}/faces`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setRegisteredFaces(data.totalFaces || 0);
      } catch (err) {
        console.error("Error fetching registered faces:", err);
      }
    };
    fetchRegisteredFaces();
  }, [studentId]);

  const captureFace = async () => {
    if (!webcamRef.current || !modelsLoaded) {
      setError("Camera not ready or models not loaded");
      return;
    }

    setIsCapturing(true);
    setError("");

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError("Failed to capture image");
        setIsCapturing(false);
        return;
      }

      // Convert base64 to image
      const img = new Image();
      img.src = imageSrc;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Detect face and get descriptor
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError(
          "No face detected. Please ensure your face is clearly visible and try again."
        );
        setIsCapturing(false);
        return;
      }

      // Send face descriptor to backend
      const token = localStorage.getItem("token");
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${API_URL}/smart-attendance/register-face`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentId: studentId,
            faceDescriptor: Array.from(detection.descriptor),
            imageBase64: imageSrc,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register face");
      }

      setSuccess(`Face ${currentStep + 1}/5 registered successfully!`);
      setRegisteredFaces(data.totalRegisteredFaces);

      // Move to next step or complete
      if (currentStep < 4) {
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          setSuccess("");
        }, 1500);
      } else {
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error capturing face:", err);
      setError(err.message || "Failed to register face");
    } finally {
      setIsCapturing(false);
    }
  };

  if (!modelsLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading face detection models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Face Registration
        </h2>
        <p className="text-gray-600 mb-6">
          Register 5 different angles of your face for better recognition
          accuracy. Already registered: {registeredFaces}/5
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {faceAngles.map((_, index) => (
              <div
                key={index}
                className={`w-1/6 h-2 rounded ${
                  index <= currentStep ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Step {currentStep + 1} of 5
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

        {/* Webcam */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="rounded-lg border-4 border-gray-300"
              width={640}
              height={480}
            />
            {isCapturing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                <div className="text-white text-xl">Processing...</div>
              </div>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Capture Button */}
        <div className="flex justify-center">
          <button
            onClick={captureFace}
            disabled={isCapturing}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition ${
              isCapturing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isCapturing ? "Capturing..." : "Capture Face"}
          </button>
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

export default FaceRegistration;
