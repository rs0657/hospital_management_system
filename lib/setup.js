import { initSQLiteDB } from '../lib/sqlite-db.js';

// Initialize SQLite database on server startup
export default async function setup() {
  if (process.env.DATABASE_URL?.startsWith('sqlite:')) {
    console.log('🔄 Initializing SQLite database...');
    await initSQLiteDB();
    console.log('✅ SQLite database ready for authentication');
  }
}

// Run setup immediately
setup().catch(console.error);
