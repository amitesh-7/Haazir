import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { sequelize, User } from '../models';

dotenv.config();

async function main() {
  const email = process.argv[2] || 'coordinator@example.com';
  const password = process.argv[3] || 'Password123!';

  try {
    await sequelize.authenticate();
    console.log('DB connected. Seeding coordinator if missing...');

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log(`User already exists: ${email} (role: ${existing.role})`);
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password_hash, role: 'coordinator' });
    console.log('Created coordinator user:', { user_id: user.user_id, email: user.email });
    console.log('NOTE: Change the default password in production.');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    await sequelize.close();
  }
}

main();
