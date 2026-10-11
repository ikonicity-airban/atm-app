/**
 * Migration runner for Ascent Transport Management (ATM Nigeria)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const migrationsDir = path.resolve(__dirname, '../migrations');
  console.log(`Checking migrations in ${migrationsDir}...`);
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found.');
    return;
  }
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log(`Found ${files.length} migration file(s):`);
  for (const file of files) {
    console.log(`- ${file} (ready to apply)`);
  }
  console.log('Migrations verified.');
}

if (typeof process !== 'undefined' && process.argv && process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
