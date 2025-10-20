import { QueryInterface } from "sequelize";
import { sequelize } from "../config/database";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  try {
    console.log("🔄 Running teacher_courses table migration...");

    const migrationPath = path.join(
      __dirname,
      "../../../database/migrations/020_create_teacher_courses_table.sql"
    );

    const sqlContent = fs.readFileSync(migrationPath, "utf-8");

    // Remove comments and split by semicolon
    const cleanedSql = sqlContent
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");

    const statements = cleanedSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.toUpperCase().startsWith("COMMENT"));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      await sequelize.query(statement);
    }

    console.log("✅ Migration completed successfully!");
    console.log("📋 Summary:");
    console.log("   - Created teacher_courses junction table");
    console.log(
      "   - Migrated placeholder timetable entries (00:00-00:00) to teacher_courses"
    );
    console.log("   - Removed placeholder entries from timetable");
    console.log("   - Added indexes for better performance");
    console.log("");
    console.log(
      "🎉 Teacher-course assignments are now properly separated from timetable schedules!"
    );

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
