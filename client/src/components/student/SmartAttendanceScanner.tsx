
import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import {
  Html5Qrcode,
  Html5QrcodeScanner,
  Html5QrcodeScanType,
} from "html5-qrcode";
import Webcam from "react-webcam";

interface SmartAttendanceScannerProps {
  studentId: number;
  onSuccess: () => void;
}

const SmartAttendanceScanner: React.FC<SmartAttendanceScannerProps> = ({
  studentId,
  onSuccess,
}) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState<boolean | null>(null);
  const [step, setStep] = useState<"qr" | "face" | "waiting">("qr");
  const [sessionData, setSessionData] = useState<any>(null);
  const [countdown, setCountdown] = useState(90); // Increased to 90 seconds to match server
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [cameraPermission, setCameraPermission] = useState<string>("prompt");
  const [scannerInitializing, setScannerInitializing] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Check if student has enrolled their face
  useEffect(() => {
    const checkFaceEnrollment = async () => {
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
        setFaceEnrolled((data.totalFaces || 0) >= 3); // Require at least 3 face samples
      } catch (err) {
        console.error("Error checking face enrollment:", err);
        setFaceEnrolled(false);
      }
    };
    checkFaceEnrollment();
  }, [studentId]);

  // Check camera permission
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // Check if Permissions API is supported
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          console.log("Camera permission state:", result.state);
          setCameraPermission(result.state);
          result.onchange = () => {
            console.log("Camera permission changed to:", result.state);
            setCameraPermission(result.state);
            // Force scanner reinitialization if permission granted
            if (result.state === "granted" && qrScannerRef.current) {
              qrScannerRef.current.clear().catch(() => {});
              qrScannerRef.current = null;
            }
          };
        } else {
          // If Permissions API not supported, try to access camera directly
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            stream.getTracks().forEach((track) => track.stop());
            setCameraPermission("granted");
            console.log("Camera permission granted (fallback method)");
          } catch (err) {
            setCameraPermission("denied");
            console.log("Camera permission denied (fallback method)");
          }
        }
      } catch (err) {
        console.error("Error checking camera permission:", err);
      }
    };
    checkCameraPermission();
  }, []);

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
        setError("Failed to load face detection models");
      }
    };
    loadModels();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error("Error getting location:", err);
          setError(
            "Location access denied. Please enable location services to mark attendance."
          );
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  }, []);

  // Camera permission is handled by Html5Qrcode library itself
  // No need for separate getUserMedia call that creates duplicate camera instance

  // Initialize QR scanner using Html5Qrcode (more reliable than Html5QrcodeScanner)
  useEffect(() => {
    // Only initialize if we're on QR step and scanner not already initialized
    // Html5Qrcode will request camera permission automatically
    if (step === "qr" && !html5QrcodeRef.current) {
      setScannerInitializing(true);
      console.log("🎬 Starting QR Scanner Initialization Process...");

      const initScanner = async () => {
        try {
          // CRITICAL: Wait for DOM element to be available
          let retries = 0;
          const maxRetries = 20; // 20 retries = 2 seconds (20 * 100ms)

          while (retries < maxRetries) {
            const element = document.getElementById("qr-reader");
            if (element) {
              console.log(
                "✅ Found qr-reader element after",
                retries,
                "retries"
              );
              break;
            }
            console.log(
              `⏳ Waiting for qr-reader element (attempt ${
                retries + 1
              }/${maxRetries})...`
            );
            await new Promise((resolve) => setTimeout(resolve, 100));
            retries++;
          }

          const element = document.getElementById("qr-reader");
          if (!element) {
            throw new Error(
              "HTML Element with id=qr-reader not found after waiting 2 seconds. Please refresh the page."
            );
          }

          // Clear any existing scanner
          if (html5QrcodeRef.current) {
            console.log("⚠️ Clearing existing scanner...");
            try {
              await html5QrcodeRef.current.stop();
            } catch (e) {
              console.log("Scanner already stopped or not running");
            }
            html5QrcodeRef.current = null;
          }

          console.log("🚀 Creating Html5Qrcode instance...");
          const html5QrCode = new Html5Qrcode("qr-reader");
          html5QrcodeRef.current = html5QrCode;

          // Get available cameras
          console.log("📷 Checking available cameras...");
          const cameras = await Html5Qrcode.getCameras();
          console.log(`✅ Found ${cameras.length} camera(s):`, cameras);

          if (cameras.length === 0) {
            throw new Error("No cameras found on this device");
          }

          // Use the back camera if available (usually better for QR scanning)
          const cameraId = cameras.length > 1 ? cameras[1].id : cameras[0].id;
          console.log(`� Using camera: ${cameraId}`);

          // Start scanning
          console.log("▶️ Starting camera and QR detection...");
          await html5QrCode.start(
            cameraId,
            {
              fps: 30, // High FPS for fast detection
              qrbox: { width: 350, height: 350 },
              aspectRatio: 1.0,
            },
            async (decodedText, decodedResult) => {
              // SUCCESS! QR Code detected
              console.log("🎉🎉🎉 QR CODE SUCCESSFULLY SCANNED!");
              console.log("✅ Decoded Text:", decodedText);
              console.log("✅ Text Length:", decodedText.length);
              console.log("✅ Result:", decodedResult);

              // Stop the scanner immediately
              try {
                await html5QrCode.stop();
                html5QrcodeRef.current = null;
                console.log("✅ Scanner stopped successfully");
              } catch (err) {
                console.error("Error stopping scanner:", err);
              }

              // Process the QR code
              handleQRScanned(decodedText);
            },
            (errorMessage) => {
              // This is called for every frame where no QR is detected
              // Silently ignore common errors
              if (
                !errorMessage.includes("NotFoundException") &&
                !errorMessage.includes("No MultiFormat Readers")
              ) {
                // Only log unexpected errors
                console.warn("⚠️ Scanner error:", errorMessage);
              }
            }
          );

          console.log("✅✅✅ QR Scanner started successfully!");
          console.log("📱 Point your camera at the QR code now");
          setScannerInitializing(false);
          setCameraPermission("granted"); // Ensure state reflects camera is active
        } catch (err: any) {
          console.error("❌ Error initializing QR scanner:", err);
          setError(
            `Failed to initialize QR scanner: ${err.message || "Unknown error"}`
          );
          setScannerInitializing(false);
        }
      };

      // Delay to ensure DOM is fully rendered
      const timer = setTimeout(initScanner, 500); // Increased from 300ms to 500ms

      return () => clearTimeout(timer);
    }

    // Cleanup function
    return () => {
      if (html5QrcodeRef.current) {
        console.log("🧹 Cleaning up QR scanner...");
        html5QrcodeRef.current
          .stop()
          .then(() => {
            console.log("✅ Scanner stopped and cleaned up");
            html5QrcodeRef.current = null;
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err);
            html5QrcodeRef.current = null;
          });
      }
    };
  }, [step]); // Removed cameraPermission dependency - Html5Qrcode handles permission

  // Countdown timer for face verification
  useEffect(() => {
    if (step === "face" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (step === "face" && countdown === 0) {
      setError("Time's up! Please scan the QR code again.");
      setStep("qr");
      setCountdown(60);
    }
  }, [step, countdown]);

  const handleQRScanned = async (qrToken: string) => {
    setIsProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${API_URL}/smart-attendance/validate-qr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ qrToken }),
        }
      );

      const data = await response.json();

      console.log("📥 Response from server:", {
        status: response.status,
        ok: response.ok,
        data: data,
      });

      if (!response.ok) {
        const errorMsg = data.error || "Invalid QR code";
        const errorDetails = data.details ? ` (${data.details})` : "";
        console.error("❌ Server returned error:", errorMsg + errorDetails);
        throw new Error(errorMsg + errorDetails);
      }

      // QR is valid, move to face verification
      console.log(
        "✅ QR validated successfully! Moving to face verification..."
      );
      setSessionData(data.session);
      setCountdown(data.session.scanTimeout || 60); // Default to 60 seconds
      setStep("face");
    } catch (err: any) {
      console.error("❌❌❌ Error validating QR:", err);
      console.error("Error type:", typeof err);
      console.error("Error message:", err.message);
      setError(err.message || "Failed to validate QR code. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const captureFaceAndVerify = async () => {
    if (!webcamRef.current || !modelsLoaded || !location) {
      setError("Camera not ready, models not loaded, or location unavailable");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError("Failed to capture image");
        setIsProcessing(false);
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
          "No face detected. Please ensure your face is clearly visible."
        );
        setIsProcessing(false);
        return;
      }

      // Send to backend for verification
      const token = localStorage.getItem("token");
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(
        `${API_URL}/smart-attendance/verify-face`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            studentId: studentId,
            faceDescriptor: Array.from(detection.descriptor),
            faceImageBase64: imageSrc,
            locationLat: location.lat,
            locationLng: location.lng,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Face verification failed");
      }

      // Success!
      setSuccess(
        `Attendance marked! Confidence: ${(data.scan.confidence * 100).toFixed(
          1
        )}%`
      );
      setStep("waiting");

      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      console.error("Error verifying face:", err);
      setError(err.message || "Failed to verify face");
      setIsProcessing(false);
    }
  };

  // Check if face enrollment status is still loading
  if (faceEnrolled === null || !modelsLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {faceEnrolled === null
              ? "Checking enrollment status..."
              : "Loading face detection models..."}
          </p>
        </div>
      </div>
    );
  }

  // If face not enrolled, show enrollment prompt
  if (faceEnrolled === false) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Face Enrollment Required
            </h2>
            <p className="text-gray-600 mb-6 text-lg">
              Before you can use the QR code attendance system, you need to
              register your face.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
              <p className="text-blue-800 font-semibold mb-2">
                📸 Why do I need to enroll my face?
              </p>
              <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                <li>
                  Your face is used to verify your identity when marking
                  attendance
                </li>
                <li>
                  This prevents proxy attendance (someone else scanning for you)
                </li>
                <li>It's a one-time setup that takes less than 2 minutes</li>
                <li>
                  We'll capture your face from 5 different angles for accuracy
                </li>
              </ul>
            </div>
            <button
              onClick={() =>
                (window.location.href = "/student/face-enrollment")
              }
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
            >
              Enroll My Face Now
            </button>
            <p className="text-gray-500 text-sm mt-4">
              This is required to use smart attendance features
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Smart Attendance Scanner
        </h2>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step === "qr"
                  ? "bg-blue-500 text-white"
                  : "bg-green-500 text-white"
              }`}
            >
              1
            </div>
            <div className="text-sm font-semibold">Scan QR</div>
            <div className="w-12 h-1 bg-gray-300"></div>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step === "face"
                  ? "bg-blue-500 text-white"
                  : step === "waiting"
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              2
            </div>
            <div className="text-sm font-semibold">Verify Face</div>
          </div>
        </div>

        {/* QR Scanning Step */}
        {step === "qr" && (
          <div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <p className="text-blue-800 font-semibold">
                Step 1: Scan the QR code displayed by your teacher
              </p>
              <p className="text-blue-600 text-sm mt-2">
                Make sure you're in the classroom and have location enabled
              </p>
            </div>

            {/* Camera Permission Warning */}
            {cameraPermission === "denied" && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-800 font-semibold mb-2">
                  ⚠️ Camera Access Denied
                </p>
                <p className="text-red-600 text-sm mb-3">
                  Please enable camera access in your browser settings to use
                  the QR scanner.
                </p>
                <div className="bg-white border border-red-200 rounded p-3 text-sm text-gray-700">
                  <p className="font-semibold mb-2">How to enable camera:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Click the camera icon in your browser's address bar</li>
                    <li>Select "Allow" for camera access</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              </div>
            )}

            {cameraPermission === "prompt" && !scannerInitializing && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                <p className="text-yellow-800 font-semibold mb-2">
                  📷 Camera Permission Required
                </p>
                <p className="text-yellow-600 text-sm">
                  Please click "Allow" when your browser asks for camera access.
                </p>
              </div>
            )}

            {/* Camera Permission Granted but Scanner Not Ready */}
            {cameraPermission === "granted" &&
              !html5QrcodeRef.current &&
              !scannerInitializing && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                  <p className="text-blue-800 font-semibold mb-2">
                    ✅ Camera Access Granted
                  </p>
                  <p className="text-blue-600 text-sm">
                    Scanner will start automatically...
                  </p>
                </div>
              )}

            {/* Scanner Initializing */}
            {scannerInitializing && (
              <div className="flex flex-col items-center justify-center py-12 mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600 font-medium">
                  Initializing QR scanner...
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Please wait while we set up your camera
                </p>
              </div>
            )}

            <div id="qr-reader" className="w-full max-w-2xl mx-auto mb-4"></div>

            {/* Help Text */}
            {!scannerInitializing && (
              <div className="text-center mt-4 text-gray-600 text-sm">
                <p>📱 Point your camera at the teacher's QR code</p>
                <p className="mt-1">
                  The scanner will automatically detect and scan the code
                </p>
              </div>
            )}

            {/* Manual Camera Request Button */}
            {cameraPermission === "denied" && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                      });
                      stream.getTracks().forEach((track) => track.stop());
                      setCameraPermission("granted");
                      window.location.reload();
                    } catch (err) {
                      console.error("Camera access error:", err);
                      setError(
                        "Unable to access camera. Please check your browser settings."
                      );
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  🔄 Request Camera Access
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="flex justify-center mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        )}

        {/* Face Verification Step */}
        {step === "face" && (
          <div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
              <p className="text-orange-800 font-semibold">
                Step 2: Face Verification - Time remaining: {countdown}s
              </p>
              <p className="text-orange-600 text-sm mt-2">
                Position your face in the frame and click "Verify Face"
              </p>
            </div>

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
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <div className="text-white text-xl">Verifying...</div>
                  </div>
                )}

                {/* Countdown overlay */}
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-2xl">
                  {countdown}s
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={captureFaceAndVerify}
                disabled={isProcessing}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition ${
                  isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isProcessing ? "Verifying..." : "Verify Face"}
              </button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === "waiting" && success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-8">
            <div className="flex items-center">
              <svg
                className="w-12 h-12 text-green-500 mr-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <p className="text-green-800 font-bold text-xl">{success}</p>
                <p className="text-green-600 text-sm mt-2">
                  Your attendance will be finalized once the teacher captures
                  the class photo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
            <p className="text-red-700">{error}</p>
            {step === "face" && (
              <button
                onClick={() => {
                  setStep("qr");
                  setError("");
                  setCountdown(60);
                }}
                className="mt-2 text-red-600 hover:text-red-800 underline"
              >
                Scan QR code again
              </button>
            )}
          </div>
        )}

        {/* Location Warning */}
        {!location && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
            <p className="text-yellow-800">
              <strong>Warning:</strong> Location access is required to mark
              attendance. Please enable location services.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartAttendanceScanner;
