const dotenv = require('dotenv');
const { initializeDatabase, seedDatabase } = require('./database.js');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('Initializing database...');
  console.log('Database URL:', process.env.DATABASE_URL);
  
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
