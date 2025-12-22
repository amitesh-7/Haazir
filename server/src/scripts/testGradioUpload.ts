/**
 * Test Gradio File Upload Format
 * Try uploading as a file instead of base64
 */

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const RETINAFACE_BASE_URL = "https://aimbot7-retinaface-haazir-api.hf.space";

async function testFileUpload() {
  console.log("🔍 Testing Gradio file upload format...\n");

  try {
    // Step 1: Download a test image
    console.log("1️⃣ Downloading test image...");
    const testImageUrl =
      "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png";
    const imageResponse = await axios.get(testImageUrl, {
      responseType: "arraybuffer",
    });
    const tempPath = path.join(__dirname, "temp_test.png");
    fs.writeFileSync(tempPath, imageResponse.data);
    console.log(`   ✅ Saved to ${tempPath}\n`);

    // Step 2: Upload file to Gradio
    console.log("2️⃣ Uploading file to Gradio...");
    const formData = new FormData();
    formData.append("files", fs.createReadStream(tempPath));

    const uploadResponse = await axios.post(
      `${RETINAFACE_BASE_URL}/upload`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000,
      }
    );

    console.log("   ✅ Upload successful!");
    console.log("   Response:", uploadResponse.data);

    const uploadedFilePath = uploadResponse.data[0];

    // Step 3: Call predict with uploaded file path
    console.log("\n3️⃣ Calling predict API with file path...");
    const predictResponse = await axios.post(
      `${RETINAFACE_BASE_URL}/api/predict`,
      { data: [uploadedFilePath] },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      }
    );

    console.log("   ✅ Prediction successful!");
    const resultJson = predictResponse.data.data[1];
    const result =
      typeof resultJson === "string" ? JSON.parse(resultJson) : resultJson;
    console.log("\n📊 Result:", {
      success: result.success,
      total_faces: result.total_faces,
      faces_detected: result.faces?.length || 0,
    });

    // Cleanup
    fs.unlinkSync(tempPath);
    console.log("\n✅ Test completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Test failed!");
    if (error.response) {
      console.error(`   HTTP Error: ${error.response.status}`);
      console.error(`   Response:`, error.response.data);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

testFileUpload();
