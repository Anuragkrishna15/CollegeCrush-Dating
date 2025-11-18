const fs = require('fs');
const path = require('path');
const { Parser } = require('node-sql-parser');

const parser = new Parser();

const files = [
  'database_setup.sql',
  'seed_data.sql',
  'storage_setup.sql',
  'backend/controllers/migrations/001_initial_schema.sql',
  'backend/controllers/migrations/002_add_file_size_to_storage_objects.sql',
  'backend/models/database_setup.sql',
  'backend/models/storage_setup.sql',
  'backend/routes/seeds/development-seed.sql',
  'scripts/database_setup.sql',
  'scripts/storage_setup.sql',
  'scripts/migrations/001_initial_schema.sql',
  'scripts/seeds/development-seed.sql'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    parser.parse(sql, { database: 'postgresql' });
    console.log(`${file}: OK`);
  } catch (e) {
    console.log(`${file}: ERROR - ${e.message}`);
  }
});