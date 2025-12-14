import { spawn } from 'child_process';
import * as path from 'path';

const name = process.argv[2];
if (!name) {
  console.error('❌ Please provide a migration name.\nUsage: npm run migration:generate MyMigration');
  process.exit(1);
}

const migrationPath = path.join('src', 'database', 'migrations', name);
const args = [
  '-d', 'src/database/data-source.ts',
  'migration:generate',
  migrationPath
];

console.log(`⚡ Generating migration: ${migrationPath}`);
const child = spawn('npx', ['typeorm-ts-node-commonjs', ...args], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));