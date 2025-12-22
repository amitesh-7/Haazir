/**
 * Check Face Descriptor Dimensions
 * This script checks if existing face registrations use old 128D (face-api.js) or new 512D (RetinaFace) format
 */

import sequelize from "../config/database";

async function checkFaceDescriptorDimensions() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.\n");

    // Get dimension distribution
    const [results] = (await sequelize.query(`
      SELECT 
        jsonb_array_length(face_descriptor::jsonb) as dimension,
        COUNT(*) as count
      FROM student_faces 
      WHERE is_active = true
      GROUP BY jsonb_array_length(face_descriptor::jsonb)
      ORDER BY dimension
    `)) as any;

    console.log("📊 Face Descriptor Dimension Distribution:");
    console.log("─────────────────────────────────────────");

    let totalOld = 0;
    let totalNew = 0;

    results.forEach((row: any) => {
      const dim = parseInt(row.dimension);
      const count = parseInt(row.count);
      const format =
        dim === 128
          ? "(face-api.js - OLD)"
          : dim === 512
          ? "(RetinaFace - NEW)"
          : "(unknown)";
      console.log(`   ${dim}D: ${count} faces ${format}`);

      if (dim === 128) totalOld += count;
      else if (dim === 512) totalNew += count;
    });

    console.log("─────────────────────────────────────────");
    console.log(`   Old format (128D): ${totalOld}`);
    console.log(`   New format (512D): ${totalNew}`);

    if (totalOld > 0) {
      console.log(
        "\n⚠️  WARNING: There are old 128D face descriptors that will NOT work"
      );
      console.log("   with the new RetinaFace-based dual verification system.");
      console.log(
        "\n   Students with old registrations will need to re-register their faces."
      );
      console.log("\n   To clear old registrations, run:");
      console.log(
        "   UPDATE student_faces SET is_active = false WHERE jsonb_array_length(face_descriptor::jsonb) = 128;"
      );
    } else if (totalNew > 0) {
      console.log(
        "\n✅ All face registrations use the new RetinaFace 512D format."
      );
    } else {
      console.log("\n📝 No active face registrations found.");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await sequelize.close();
    console.log("\n🔌 Database connection closed.");
  }
}

checkFaceDescriptorDimensions();
