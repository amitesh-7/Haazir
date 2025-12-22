/**
 * Deactivate Old Face Descriptors
 * This script deactivates old 128D face-api.js descriptors to require re-registration with RetinaFace
 */

import sequelize from "../config/database";

async function deactivateOldFaceDescriptors() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.\n");

    // Count old descriptors
    const [countResult] = (await sequelize.query(`
      SELECT COUNT(*) as count
      FROM student_faces 
      WHERE is_active = true
      AND jsonb_array_length(face_descriptor::jsonb) = 128
    `)) as any;

    const oldCount = parseInt(countResult[0].count);

    if (oldCount === 0) {
      console.log(
        "✅ No old 128D face descriptors found. Nothing to deactivate."
      );
      return;
    }

    console.log(`📊 Found ${oldCount} old 128D face descriptors.`);
    console.log("🔄 Deactivating old face descriptors...\n");

    // Deactivate old descriptors
    const [, metadata] = (await sequelize.query(`
      UPDATE student_faces 
      SET is_active = false, 
          updated_at = NOW()
      WHERE is_active = true
      AND jsonb_array_length(face_descriptor::jsonb) = 128
    `)) as any;

    console.log(
      `✅ Deactivated ${metadata.rowCount || oldCount} old face descriptors.`
    );
    console.log(
      "\n📋 Students will need to re-register their faces using the new RetinaFace system."
    );
    console.log("   They can do this at: /student/face-registration");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Database connection closed.");
  }
}

deactivateOldFaceDescriptors();
