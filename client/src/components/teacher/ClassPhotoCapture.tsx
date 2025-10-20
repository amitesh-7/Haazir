import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import Webcam from "react-webcam";
import {
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

interface ClassPhotoCaptureProps {
  sessionId: string;
  onPhotoProcessed: (matchedStudentIds: number[]) => void;
  onBack: () => void;
}

const ClassPhotoCapture: React.FC<ClassPhotoCaptureProps> = ({
  sessionId,
  onPhotoProcessed,
  onBack,
}) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureMode, setCaptureMode] = useState<"webcam" | "upload" | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<any[]>([]);
  const [capturedImage, setCapturedImage] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [matchedStudentIds, setMatchedStudentIds] = useState<number[]>([]);

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const detectFacesInImage = async (imageElement: HTMLImageElement) => {
    try {
      const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      return detections;
    } catch (err) {
      console.error("Error detecting faces:", err);
      throw err;
    }
  };

  const handleCaptureFromWebcam = async () => {
    if (!webcamRef.current || !modelsLoaded) {
      setError("Camera not ready or models not loaded");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("Failed to capture image");
      }

      setCapturedImage(imageSrc);
      await processImage(imageSrc);
    } catch (err: any) {
      console.error("Error capturing from webcam:", err);
      setError(err.message || "Failed to capture photo");
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageSrc = e.target?.result as string;
        setCapturedImage(imageSrc);
        await processImage(imageSrc);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setError(err.message || "Failed to upload photo");
      setIsProcessing(false);
    }
  };

  const processImage = async (imageSrc: string) => {
    try {
      // Create image element
      const img = new Image();
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Detect all faces
      const detections = await detectFacesInImage(img);

      if (detections.length === 0) {
        throw new Error(
          "No faces detected in the photo. Please ensure students are clearly visible."
        );
      }

      setDetectedFaces(detections);

      // Prepare data for backend
      const detectedFacesData = detections.map((detection) => ({
        descriptor: Array.from(detection.descriptor),
        bbox: {
          x: detection.detection.box.x,
          y: detection.detection.box.y,
          width: detection.detection.box.width,
          height: detection.detection.box.height,
        },
      }));

      // Send to backend for matching
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/smart-attendance/process-class-photo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: sessionId,
            imageBase64: imageSrc,
            detectedFaces: detectedFacesData,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process class photo");
      }

      setMatchedStudentIds(data.matchedStudentIds || []);
      setSuccess(
        `Successfully detected ${detections.length} faces and matched ${data.matchedStudentIds.length} students!`
      );

      // Wait 2 seconds then notify parent
      setTimeout(() => {
        onPhotoProcessed(data.matchedStudentIds || []);
      }, 2000);
    } catch (err: any) {
      console.error("Error processing image:", err);
      setError(err.message || "Failed to process photo");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage("");
    setDetectedFaces([]);
    setError("");
    setSuccess("");
    setMatchedStudentIds([]);
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

  if (!captureMode) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <button
            onClick={onBack}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Monitoring
          </button>

          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Capture Class Photo
          </h2>
          <p className="text-gray-600 mb-6">
            Choose how you want to capture the class photo for bulk face
            detection
          </p>

          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => setCaptureMode("webcam")}
              className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-500 rounded-lg p-8 text-center transition"
            >
              <Camera size={48} className="mx-auto text-blue-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Use Webcam</h3>
              <p className="text-sm text-gray-600">
                Capture a live photo using your device's camera
              </p>
            </button>

            <button
              onClick={() => {
                setCaptureMode("upload");
                fileInputRef.current?.click();
              }}
              className="bg-green-50 hover:bg-green-100 border-2 border-green-500 rounded-lg p-8 text-center transition"
            >
              <Upload size={48} className="mx-auto text-green-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Upload Photo</h3>
              <p className="text-sm text-gray-600">
                Upload an existing photo from your device
              </p>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
            <h4 className="font-bold text-yellow-800 mb-2">
              Tips for best results:
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Ensure good lighting in the classroom</li>
              <li>Capture all students in a single frame</li>
              <li>Students should face the camera</li>
              <li>Avoid blurry or dark photos</li>
              <li>Higher resolution photos work better</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <button
          onClick={() => {
            setCaptureMode(null);
            handleRetake();
          }}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Options
        </button>

        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {captureMode === "webcam" ? "Webcam Capture" : "Photo Upload"}
        </h2>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="text-red-600 mr-2" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="text-green-600 mr-2" size={20} />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {!capturedImage && captureMode === "webcam" && (
          <div>
            <div className="flex justify-center mb-6">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="rounded-lg border-4 border-gray-300 max-w-full"
                width={800}
                height={600}
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleCaptureFromWebcam}
                disabled={isProcessing}
                className={`px-8 py-3 rounded-lg font-semibold text-white flex items-center space-x-2 ${
                  isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <Camera size={20} />
                <span>{isProcessing ? "Processing..." : "Capture Photo"}</span>
              </button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div>
            <div className="mb-6">
              <img
                src={capturedImage}
                alt="Captured class"
                className="rounded-lg border-4 border-gray-300 max-w-full mx-auto"
              />
            </div>

            {detectedFaces.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-xl text-blue-800 mb-3">
                  Detection Results
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {detectedFaces.length}
                    </p>
                    <p className="text-sm text-gray-600">Faces Detected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {matchedStudentIds.length}
                    </p>
                    <p className="text-sm text-gray-600">Students Matched</p>
                  </div>
                </div>
              </div>
            )}

            {isProcessing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Processing faces... This may take a moment.
                </p>
              </div>
            ) : (
              !success && (
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleRetake}
                    className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500"
                  >
                    Retake Photo
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassPhotoCapture;
