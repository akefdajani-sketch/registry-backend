require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('../db');

async function run() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf8');

    console.log(`Running migration: ${file}`);
    await db.query(sql);
  }

  console.log('All migrations completed');
  await db.end();
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
