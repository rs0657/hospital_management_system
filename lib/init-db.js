import { initializeDatabase, seedDatabase } from './database.js';

async function main() {
  console.log('Initializing database...');
  
  const initialized = await initializeDatabase();
  if (initialized) {
    console.log('Database schema created successfully');
    
    console.log('Seeding database with existing data...');
    await seedDatabase();
    console.log('Database setup complete!');
  } else {
    console.error('Failed to initialize database');
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(console.error);
