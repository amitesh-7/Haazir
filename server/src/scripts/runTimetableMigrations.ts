import { sequelize } from '../config/database';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Read and execute migration files
    const migrationFiles = [
      '021_create_time_slots.sql',
      '022_create_timetable_system.sql'
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, '../../../database/migrations', file);
      
      if (fs.existsSync(filePath)) {
        console.log(`📄 Running migration: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Execute the SQL
        await sequelize.query(sql);
        console.log(`✅ Migration ${file} completed successfully`);
      } else {
        console.log(`⚠️  Migration file not found: ${file}`);
        console.log(`    Looked in: ${filePath}`);
      }
    }

    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();