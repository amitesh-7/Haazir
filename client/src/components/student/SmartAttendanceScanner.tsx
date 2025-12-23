import React, { useState, useRef, useEffect } from "react";
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import Webcam from "react-webcam";
import { API_BASE_URL } from "../../config/api";

interface SmartAttendanceScannerProps {
  studentId: number;
  onSuccess: () => void;
}

const SmartAttendanceScanner: React.FC<SmartAttendanceScannerProps> = ({
  studentId,
  onSuccess,
}) => {
  const [faceEnrolled, setFaceEnrolled] = useState<boolean | null>(null);
  const [step, setStep] = useState<"qr" | "face" | "waiting">("qr");
  const [sessionData, setSessionData] = useState<any>(null);
  const [countdown, setCountdown] = useState(90); // Increased to 90 seconds to match server
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraPermission, setCameraPermission] = useState<string>("prompt");
  const [scannerInitializing, setScannerInitializing] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment"); // "user" = front, "environment" = back
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);

  const webcamRef = useRef<Webcam>(null);
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Check if student has enrolled their face
  useEffect(() => {
    const checkFaceEnrollment = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = API_BASE_URL;
        const response = await fetch(`${API_URL}/smart-attendance/student/${studentId}/faces`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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
          setError("Location access denied. Please enable location services to mark attendance.");
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
    // Only initialize if we're on QR step
    if (step !== "qr") {
      return;
    }

    // Prevent double initialization
    if (html5QrcodeRef.current) {
      console.log("⚠️ Scanner already initialized, skipping...");
      return;
    }

    if (scannerInitializing) {
      console.log("⚠️ Scanner already initializing, skipping...");
      return;
    }

    console.log("🎬 Starting QR Scanner Initialization Process...");

    const initScanner = async () => {
      try {
        setScannerInitializing(true);

        // CRITICAL: Wait for DOM element to be available with longer timeout
        let retries = 0;
        const maxRetries = 30; // 30 retries = 3 seconds (30 * 100ms)

        while (retries < maxRetries) {
          const element = document.getElementById("qr-reader");
          if (element) {
            console.log("✅ Found qr-reader element after", retries, "retries");
            break;
          }
          console.log(`⏳ Waiting for qr-reader element (attempt ${retries + 1}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }

        const element = document.getElementById("qr-reader");
        if (!element) {
          throw new Error(
            "HTML Element with id=qr-reader not found after waiting 3 seconds. Please refresh the page."
          );
        }

        // Double-check no scanner exists
        if (html5QrcodeRef.current) {
          console.log("⚠️ Scanner already exists, aborting new initialization");
          setScannerInitializing(false);
          return;
        }

        console.log("🚀 Creating Html5Qrcode instance...");
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrcodeRef.current = html5QrCode;

        // Get available cameras
        console.log("📷 Checking available cameras...");
        const cameras = await Html5Qrcode.getCameras();
        console.log(`✅ Found ${cameras.length} camera(s):`, cameras);
        setAvailableCameras(cameras);

        if (cameras.length === 0) {
          throw new Error("No cameras found on this device");
        }

        // Select camera based on facing mode
        let cameraId = cameras[0].id;
        if (facingMode === "environment" && cameras.length > 1) {
          // Use back camera (usually index 1)
          cameraId = cameras[1].id;
        } else if (facingMode === "user") {
          // Use front camera (usually index 0)
          cameraId = cameras[0].id;
        }
        console.log(`📹 Using camera (${facingMode}): ${cameraId}`);

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
        setError(`Failed to initialize QR scanner: ${err.message || "Unknown error"}`);
        setScannerInitializing(false);
        html5QrcodeRef.current = null;
      }
    };

    // Use requestAnimationFrame to ensure DOM is painted before initializing scanner
    // This is more reliable than setTimeout
    let rafId: number;
    const startInit = () => {
      rafId = requestAnimationFrame(() => {
        // Double RAF to ensure layout is complete
        requestAnimationFrame(() => {
          initScanner();
        });
      });
    };
    startInit();

    // Cleanup function
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      if (html5QrcodeRef.current) {
        console.log("🧹 Cleaning up QR scanner...");
        const scannerToStop = html5QrcodeRef.current;
        html5QrcodeRef.current = null; // Clear reference immediately to prevent double-stop

        scannerToStop
          .stop()
          .then(() => {
            console.log("✅ Scanner stopped and cleaned up");
          })
          .catch((err) => {
            console.error("Error stopping scanner during cleanup:", err);
          });
      }
    };
  }, [step, facingMode]); // Depend on step and facingMode

  // Function to switch camera
  const switchCamera = async () => {
    if (html5QrcodeRef.current) {
      try {
        console.log("🔄 Switching camera...");
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    // Toggle facing mode
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setScannerInitializing(false);
  };

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

      // Check if token exists
      if (!token) {
        console.error("❌ No auth token found in localStorage");
        setError("Session expired. Please login again.");
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "/login";
        }, 2000);
        return;
      }

      // Validate QR token format (should be a JWT token, not a short numeric code)
      if (qrToken.length < 100) {
        console.error("❌ Invalid QR code format - too short:", qrToken.length);
        setError(
          "Invalid QR code! Please scan the QR code from the Smart Attendance page, not the regular attendance page."
        );
        setStep("qr");
        return;
      }

      // Check if it looks like a JWT token (has 3 parts separated by dots)
      const jwtParts = qrToken.split(".");
      if (jwtParts.length !== 3) {
        console.error("❌ Invalid QR code format - not a JWT token");
        setError(
          "Invalid QR code format! This appears to be from the old attendance system. Please use Smart Attendance."
        );
        setStep("qr");
        return;
      }

      const API_URL = API_BASE_URL;

      console.log("📤 Sending QR validation request...");
      console.log("🔑 Auth token present:", !!token);
      console.log("🎫 QR token length:", qrToken.length);

      const response = await fetch(`${API_URL}/smart-attendance/validate-qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrToken }),
      });

      const data = await response.json();

      console.log("📥 Response from server:", {
        status: response.status,
        ok: response.ok,
        data: data,
      });

      // Handle 401 specifically (auth token expired/invalid)
      if (response.status === 401) {
        console.error("❌ Authentication failed - token may be expired");

        // Check if error is about auth token vs QR token
        if (
          data.message &&
          (data.message.includes("Invalid token") || data.message.includes("No token provided"))
        ) {
          setError("Your session has expired. Please login again.");
          setTimeout(() => {
            localStorage.clear();
            window.location.href = "/login";
          }, 2000);
          return;
        }

        // Otherwise it's a QR token issue
        const errorMsg = data.error || "Invalid or expired QR code";
        console.error("❌ QR validation error:", errorMsg);
        throw new Error(errorMsg);
      }

      if (!response.ok) {
        const errorMsg = data.error || "Invalid QR code";
        const errorDetails = data.details ? ` (${data.details})` : "";
        console.error("❌ Server returned error:", errorMsg + errorDetails);
        throw new Error(errorMsg + errorDetails);
      }

      // QR is valid, move to face verification
      console.log("✅ QR validated successfully! Moving to face verification...");
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
    if (!webcamRef.current || !location) {
      setError("Camera not ready or location unavailable");
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

      // Send to backend for verification (backend will call RetinaFace API)
      const token = localStorage.getItem("token");
      const API_URL = API_BASE_URL;
      const response = await fetch(`${API_URL}/smart-attendance/verify-face`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          studentId: studentId,
          faceImageBase64: imageSrc,
          locationLat: location.lat,
          locationLng: location.lng,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Face verification failed");
      }

      // Success!
      setSuccess(`Attendance marked! Confidence: ${(data.scan.confidence * 100).toFixed(1)}%`);
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
  if (faceEnrolled === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking enrollment status...</p>
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
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Face Enrollment Required</h2>
            <p className="text-gray-600 mb-6 text-lg">
              Before you can use the QR code attendance system, you need to register your face.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
              <p className="text-blue-800 font-semibold mb-2">
                📸 Why do I need to enroll my face?
              </p>
              <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                <li>Your face is used to verify your identity when marking attendance</li>
                <li>This prevents proxy attendance (someone else scanning for you)</li>
                <li>It's a one-time setup that takes less than 2 minutes</li>
                <li>We'll capture your face from 5 different angles for accuracy</li>
              </ul>
            </div>
            <button
              onClick={() => (window.location.href = "/student/face-enrollment")}
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
          📱 Smart Attendance Scanner
        </h2>

        {/* Step Indicator - Mobile Optimized */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div
              className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold text-lg transition-all ${
                step === "qr"
                  ? "bg-blue-500 text-white ring-4 ring-blue-200"
                  : "bg-green-500 text-white"
              }`}
            >
              {step === "qr" ? "1" : "✓"}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-gray-700">Scan QR</div>
            <div
              className={`w-8 sm:w-12 h-1 rounded ${
                step !== "qr" ? "bg-green-500" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold text-lg transition-all ${
                step === "face"
                  ? "bg-blue-500 text-white ring-4 ring-blue-200"
                  : step === "waiting"
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {step === "waiting" ? "✓" : "2"}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-gray-700">Verify Face</div>
          </div>
        </div>

        {/* QR Scanning Step */}
        {step === "qr" && (
          <div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-xl">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 text-white p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-blue-800 font-semibold">
                    Step 1: Scan the QR code displayed by your teacher
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    📍 Using {facingMode === "environment" ? "back" : "front"} camera • Make sure
                    you're in the classroom
                  </p>
                </div>
              </div>
            </div>

            {/* Camera Permission Warning */}
            {cameraPermission === "denied" && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl">
                <p className="text-red-800 font-semibold mb-2">⚠️ Camera Access Denied</p>
                <p className="text-red-600 text-sm mb-3">
                  Please enable camera access in your browser settings to use the QR scanner.
                </p>
                <div className="bg-white border border-red-200 rounded-lg p-3 text-sm text-gray-700">
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
                <p className="text-yellow-800 font-semibold mb-2">📷 Camera Permission Required</p>
                <p className="text-yellow-600 text-sm">
                  Please click "Allow" when your browser asks for camera access.
                </p>
              </div>
            )}

            {/* Camera Permission Granted but Scanner Not Ready */}
            {cameraPermission === "granted" && !html5QrcodeRef.current && !scannerInitializing && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-blue-800 font-semibold mb-2">✅ Camera Access Granted</p>
                <p className="text-blue-600 text-sm">Scanner will start automatically...</p>
              </div>
            )}

            {/* Scanner Initializing */}
            {scannerInitializing && (
              <div className="flex flex-col items-center justify-center py-12 mb-4 bg-gray-50 rounded-2xl">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-700 font-semibold text-lg">Initializing QR scanner...</p>
                <p className="text-gray-500 text-sm mt-2">
                  Please wait while we set up your camera
                </p>
              </div>
            )}

            {/* QR Scanner Container */}
            <div className="relative mb-4">
              <div
                id="qr-reader"
                className="w-full max-w-lg mx-auto rounded-2xl overflow-hidden shadow-lg"
              ></div>

              {/* Camera indicator badge */}
              {html5QrcodeRef.current && !scannerInitializing && (
                <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg z-10">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  {facingMode === "environment" ? "📷 Back Camera" : "🤳 Front Camera"}
                </div>
              )}
            </div>

            {/* Camera Switch Button - Enhanced for Mobile */}
            {availableCameras.length > 1 && !scannerInitializing && html5QrcodeRef.current && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={switchCamera}
                  className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-3 shadow-lg font-semibold text-base transform hover:scale-105 active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Switch to {facingMode === "user" ? "Back" : "Front"} Camera
                </button>
              </div>
            )}

            {/* Help Text - Enhanced */}
            {!scannerInitializing && html5QrcodeRef.current && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-700 font-medium">
                  Point your camera at the teacher's QR code
                </p>
                <p className="text-gray-500 text-sm mt-1">
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
                      setError("Unable to access camera. Please check your browser settings.");
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
                📷 Using front camera. Position your face in the frame and click "Verify Face"
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative w-full max-w-md">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="rounded-2xl border-4 border-blue-300 shadow-xl w-full"
                  videoConstraints={{
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user", // Always use front camera for face verification
                  }}
                  mirrored={true} // Mirror for selfie view
                />

                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-64 sm:w-56 sm:h-72 border-4 border-dashed border-blue-400 rounded-full opacity-60"></div>
                </div>

                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-3"></div>
                      <div className="text-white text-xl font-semibold">Verifying...</div>
                    </div>
                  </div>
                )}

                {/* Countdown overlay */}
                <div
                  className={`absolute top-4 right-4 px-4 py-2 rounded-xl font-bold text-xl shadow-lg ${
                    countdown <= 10 ? "bg-red-500 animate-pulse" : "bg-orange-500"
                  } text-white`}
                >
                  {countdown}s
                </div>

                {/* Camera indicator */}
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Front Camera
                </div>
              </div>
            </div>

            {/* Tips for better face capture */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6 max-w-md mx-auto">
              <p className="text-blue-800 font-semibold text-sm mb-2">
                📌 Tips for better verification:
              </p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Keep your face inside the oval guide</li>
                <li>• Ensure good lighting on your face</li>
                <li>• Remove sunglasses or face coverings</li>
                <li>• Look directly at the camera</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <button
                onClick={captureFaceAndVerify}
                disabled={isProcessing}
                className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105 ${
                  isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Verify My Face
                  </span>
                )}
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
                  Your attendance will be finalized once the teacher captures the class photo.
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
              <strong>Warning:</strong> Location access is required to mark attendance. Please
              enable location services.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartAttendanceScanner;
