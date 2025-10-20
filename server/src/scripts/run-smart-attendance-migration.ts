import { sequelize } from "../config/database";
import fs from "fs";
import path from "path";

const migrationPath = path.join(
  __dirname,
  "../../../database/migrations/023_create_smart_attendance_tables.sql"
);

console.log("🔄 Starting Smart Attendance Migration...\n");
console.log("Migration file:", migrationPath);
console.log("");

async function runMigration() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection successful\n");

    // Read the migration file
    let migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Remove comments
    migrationSQL = migrationSQL
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");

    // Split into individual statements (split by semicolon but keep multiline statements together)
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("COMMENT"));

    console.log(`Found ${statements.length} SQL statements\n`);

    let completedCount = 0;
    let skippedCount = 0;

    // Execute each statement
    for (const sql of statements) {
      try {
        await sequelize.query(sql);
        completedCount++;

        if (sql.includes("CREATE TABLE")) {
          const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
          if (match) {
            console.log(`✅ Created table: ${match[1]}`);
          }
        } else if (sql.includes("CREATE INDEX")) {
          const match = sql.match(/CREATE INDEX IF NOT EXISTS (\w+)/i);
          if (match) {
            console.log(`✅ Created index: ${match[1]}`);
          }
        }
      } catch (error: any) {
        // Ignore "already exists" errors
        if (
          error.message &&
          (error.message.includes("already exists") ||
            error.message.includes("duplicate"))
        ) {
          skippedCount++;
        } else {
          console.error(`❌ Error:`, error.message);
        }
      }
    }

    console.log("\n=================================");
    console.log("✅ Migration Complete!");
    console.log("=================================");
    console.log(`✓ Executed: ${completedCount} statements`);
    if (skippedCount > 0) {
      console.log(`⊘ Skipped: ${skippedCount} (already exists)`);
    }
    console.log("\n📊 Smart Attendance Tables:");
    console.log("  ✓ attendance_sessions");
    console.log("  ✓ student_faces");
    console.log("  ✓ student_scan_records");
    console.log("  ✓ teacher_class_captures");
    console.log("  ✓ detected_class_faces");
    console.log("  ✓ smart_attendance_records");
    console.log("  ✓ attendance_notifications");
    console.log("\n✅ Database is ready!");
    console.log("\n🚀 Next steps:");
    console.log("  1. Start server: npm run dev");
    console.log("  2. Start client: cd ../client && npm start");
    console.log("  3. Test the system!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
