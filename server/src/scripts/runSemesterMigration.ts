import { sequelize } from "../config/database";

async function runSemesterMigration() {
  console.log("Starting semester migration...");

  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Add semester column to students table
    await sequelize.query(
      "ALTER TABLE students ADD COLUMN IF NOT EXISTS semester INTEGER;"
    );
    console.log("✓ Added semester column to students table");

    // Copy data from year to semester column (if year column exists)
    await sequelize.query(
      "UPDATE students SET semester = year WHERE year IS NOT NULL AND semester IS NULL;"
    );
    console.log("✓ Copied year data to semester column");

    // Add constraint for semester range (1-8)
    await sequelize.query(
      "ALTER TABLE students DROP CONSTRAINT IF EXISTS check_semester_range_students;"
    );
    await sequelize.query(
      "ALTER TABLE students ADD CONSTRAINT check_semester_range_students CHECK (semester >= 1 AND semester <= 8);"
    );
    console.log("✓ Added semester range constraint (1-8)");

    // Create index for better performance
    await sequelize.query(
      "CREATE INDEX IF NOT EXISTS idx_students_semester ON students(semester);"
    );
    console.log("✓ Created semester index");

    console.log("✅ Semester migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

runSemesterMigration()
  .then(() => {
    console.log("Migration script completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
