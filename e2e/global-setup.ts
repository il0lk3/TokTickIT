import { execSync } from 'child_process';
import path from 'path';

async function globalSetup() {
  console.log('Running global setup: seeding database...');
  try {
    const serverDir = path.resolve(__dirname, '../server');
    execSync('npm run prisma:seed', { cwd: serverDir, stdio: 'inherit' });
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Failed to run seed script:', error);
    throw error;
  }
}

export default globalSetup;
