/**
 * Dual Verification Migration Script
 * Runs the 025_create_dual_verification_tables.sql migration
 */

import sequelize from "../config/database";
import { readFileSync } from "fs";
import { join } from "path";

async function runDualVerificationMigration() {
  try {
    // Connect to the database
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    // Read the migration file
    const migrationPath = join(
      __dirname,
      "..",
      "..",
      "..",
      "database",
      "migrations",
      "025_create_dual_verification_tables.sql"
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log(
      "🔄 Running migration: 025_create_dual_verification_tables.sql"
    );

    // Split and run statements individually (to handle partial failures)
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => {
        // Filter out empty statements and comment-only statements
        const lines = s
          .split("\n")
          .filter(
            (line) => !line.trim().startsWith("--") && line.trim() !== ""
          );
        return lines.length > 0;
      });

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        await sequelize.query(statement);
        successCount++;
        const preview = statement.replace(/\s+/g, " ").substring(0, 60);
        console.log(`  ✓ ${preview}...`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate")
        ) {
          skipCount++;
          console.log(`  ⚠️ Already exists (skipped)`);
        } else if (error.message.includes("does not exist")) {
          // This might be expected for optional cleanup queries
          skipCount++;
          console.log(`  ⚠️ Skipped: ${error.message.substring(0, 80)}`);
        } else {
          errorCount++;
          console.error(`  ❌ Error: ${error.message}`);
        }
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   Successful: ${successCount}`);
    console.log(`   Skipped: ${skipCount}`);
    console.log(`   Errors: ${errorCount}`);

    // Verify tables were created
    const [tables] = (await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('class_photos', 'class_photo_faces', 'verification_logs')
    `)) as any;

    console.log("\n📊 Verification - Tables created:");
    if (tables.length > 0) {
      tables.forEach((row: any) => {
        console.log(`   ✓ ${row.table_name}`);
      });
    } else {
      console.log("   ⚠️ No new tables found (may already exist)");
    }

    // Check student face registrations
    try {
      const [faceCount] = (await sequelize.query(`
        SELECT COUNT(*) as count FROM student_faces WHERE is_active = true
      `)) as any;
      console.log(
        `\n📊 Active student face registrations: ${faceCount[0]?.count || 0}`
      );
    } catch (e) {
      // Table might not exist
    }

    console.log("\n✅ Migration completed!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await sequelize.close();
    console.log("🔌 Database connection closed.");
  }
}

runDualVerificationMigration();
