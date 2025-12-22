import sequelize from "../config/database";
import { QueryTypes } from "sequelize";
import fs from "fs";
import path from "path";

async function runMigration027() {
  try {
    console.log("🚀 Running Migration 027: Add QR Rotation Fields...");

    const migrationSQL = fs.readFileSync(
      path.join(
        __dirname,
        "../../../database/migrations/027_add_qr_rotation_fields.sql"
      ),
      "utf-8"
    );

    // Execute the migration
    await sequelize.query(migrationSQL, { type: QueryTypes.RAW });

    console.log("✅ Migration 027 completed successfully!");
    console.log("   - Added qr_rotation_count column");
    console.log("   - Added last_rotation_at column");
    console.log("   - Created index for faster rotation validation");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration 027 failed:", error);
    process.exit(1);
  }
}

runMigration027();
