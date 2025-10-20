import { sequelize } from "../config/database";
import { readFileSync } from "fs";
import { join } from "path";

async function runMigration() {
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
      "012_add_semester_to_courses.sql"
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("🔄 Running migration: 012_add_semester_to_courses.sql");

    // Execute the migration
    await sequelize.query(migrationSQL);

    console.log("✅ Migration completed successfully!");

    // Verify the column was added
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'courses' AND column_name = 'semester'
    `);

    if (results.length > 0) {
      console.log("✅ Semester column verification:", results[0]);
    } else {
      console.log("❌ Semester column not found after migration");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await sequelize.close();
    console.log("🔌 Database connection closed.");
  }
}

runMigration();
