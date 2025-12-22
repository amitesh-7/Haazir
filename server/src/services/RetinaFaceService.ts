/**
 * RetinaFace API Service
 * Handles face detection and embedding extraction via the deployed RetinaFace API
 *
 * API Endpoint: https://aimbot7-retinaface-haazir-api.hf.space/api/predict
 */

import axios from "axios";

const RETINAFACE_BASE_URL =
  process.env.RETINAFACE_BASE_URL ||
  "https://aimbot7-retinaface-haazir-api.hf.space";
const RETINAFACE_API_URL = `${RETINAFACE_BASE_URL}/api/predict`;
const API_TIMEOUT = 60000; // 60 seconds

/**
 * Face detection result interface
 */
export interface Face {
  face_id: number;
  embedding: number[]; // 512-dimensional float array
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  confidence: number; // 0.0 to 1.0
  age?: number; // Estimated age
  gender?: number; // 0 = female, 1 = male
}

/**
 * Detection result from RetinaFace API
 */
export interface DetectionResult {
  success: boolean;
  total_faces: number;
  faces: Face[];
  error?: string;
  outputImage?: string; // Base64 image with bounding boxes
}

/**
 * RetinaFace Service Class
 * Provides methods for face detection using the RetinaFace API
 */
export class RetinaFaceService {
  private apiUrl: string;
  private timeout: number;

  constructor(apiUrl?: string, timeout?: number) {
    this.apiUrl = apiUrl || RETINAFACE_API_URL;
    this.timeout = timeout || API_TIMEOUT;
  }

  /**
   * Detect faces in an image using RetinaFace API
   * @param imageBase64 - Base64 encoded image (with or without data URI prefix)
   * @returns Detection result with faces and embeddings
   */
  async detectFaces(imageBase64: string): Promise<DetectionResult> {
    try {
      // Remove data URI prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(cleanBase64, "base64");

      console.log(
        `📸 RetinaFace API: Uploading image (${Math.round(
          imageBuffer.length / 1024
        )}KB)...`
      );

      // Step 1: Upload file to Gradio
      const FormData = require("form-data");
      const formData = new FormData();
      formData.append("files", imageBuffer, {
        filename: "image.jpg",
        contentType: "image/jpeg",
      });

      const uploadResponse = await axios.post(
        `${RETINAFACE_BASE_URL}/upload`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout,
        }
      );

      const uploadedFilePath = uploadResponse.data[0];
      console.log(`📤 File uploaded: ${uploadedFilePath}`);

      // Step 2: Call predict with uploaded file path
      // Gradio expects the file path as a dictionary/object
      const fileData = {
        path: uploadedFilePath,
        url: null,
        size: null,
        orig_name: "image.jpg",
        mime_type: "image/jpeg",
      };

      const response = await axios.post(
        this.apiUrl,
        { data: [fileData] },
        {
          headers: { "Content-Type": "application/json" },
          timeout: this.timeout,
        }
      );

      console.log(`📊 RetinaFace API response status: ${response.status}`);

      // Parse the response
      // Response format: { data: [base64_image_with_boxes, json_object] }
      const outputImage = response.data.data[0];
      const resultJson = response.data.data[1];
      const result =
        typeof resultJson === "string" ? JSON.parse(resultJson) : resultJson;

      console.log(`✅ RetinaFace API: Detected ${result.total_faces} faces`);

      return {
        ...result,
        outputImage,
      };
    } catch (error: any) {
      console.error("❌ RetinaFace API error:", error.message);
      if (error.response) {
        console.error(`   Response status: ${error.response.status}`);
        console.error(`   Response data:`, error.response.data);
      }

      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          total_faces: 0,
          faces: [],
          error: "API timeout - the request took too long",
        };
      }

      if (error.response) {
        return {
          success: false,
          total_faces: 0,
          faces: [],
          error: `API error: ${error.response.status} - ${error.response.statusText}`,
        };
      }

      return {
        success: false,
        total_faces: 0,
        faces: [],
        error: error.message || "Unknown error occurred",
      };
    }
  }

  /**
   * Detect a single face (for student self-verification)
   * Validates that exactly one face is detected
   * @param imageBase64 - Base64 encoded image
   * @returns Single face detection result
   */
  async detectSingleFace(imageBase64: string): Promise<{
    success: boolean;
    face?: Face;
    error?: string;
    outputImage?: string;
  }> {
    const result = await this.detectFaces(imageBase64);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (result.total_faces === 0) {
      return {
        success: false,
        error:
          "No face detected in image. Please ensure your face is clearly visible.",
      };
    }

    if (result.total_faces > 1) {
      return {
        success: false,
        error:
          "Multiple faces detected. Please ensure only your face is visible in the frame.",
      };
    }

    return {
      success: true,
      face: result.faces[0],
      outputImage: result.outputImage,
    };
  }

  /**
   * Detect multiple faces (for class photo verification)
   * @param imageBase64 - Base64 encoded image
   * @returns Multiple face detection result
   */
  async detectMultipleFaces(imageBase64: string): Promise<{
    success: boolean;
    faces: Face[];
    totalFaces: number;
    error?: string;
    outputImage?: string;
  }> {
    const result = await this.detectFaces(imageBase64);

    if (!result.success) {
      return {
        success: false,
        faces: [],
        totalFaces: 0,
        error: result.error,
      };
    }

    return {
      success: true,
      faces: result.faces,
      totalFaces: result.total_faces,
      outputImage: result.outputImage,
    };
  }

  /**
   * Check if the RetinaFace API is available
   * @returns API health status
   */
  async healthCheck(): Promise<{
    available: boolean;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Send a minimal request to check if API is responding
      const response = await axios.get(
        this.apiUrl.replace("/api/predict", "/"),
        { timeout: 10000 }
      );

      const latency = Date.now() - startTime;
      return { available: true, latency };
    } catch (error: any) {
      return {
        available: false,
        error: error.message || "API not reachable",
      };
    }
  }
}

// Export singleton instance
export const retinaFaceService = new RetinaFaceService();

export default RetinaFaceService;
