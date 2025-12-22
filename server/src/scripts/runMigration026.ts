import sequelize from "../config/database";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  try {
    console.log(
      "📦 Running migration: 026_add_embedding_version_to_student_faces.sql"
    );

    const migrationPath = path.join(
      __dirname,
      "../../../database/migrations/026_add_embedding_version_to_student_faces.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await sequelize.query(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("   - Added embedding_version column to student_faces table");
    console.log("   - Default value set to 512 (RetinaFace embeddings)");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();
