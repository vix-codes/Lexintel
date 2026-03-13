import { spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

function maskDatabaseUrl(value) {
  try {
    const url = new URL(value);
    if (url.password) {
      url.password = '***';
    }
    return url.toString();
  } catch {
    return '[invalid DATABASE_URL]';
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
    });

    child.on('error', reject);
  });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL is missing. Set it in your deployment environment before starting the app.');
    process.exit(1);
  }

  console.log(`Using database: ${maskDatabaseUrl(databaseUrl)}`);
  console.log('Checking database connection...');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('Database connection OK.');
  } catch (error) {
    console.error('Database connection failed.');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  console.log('Applying Prisma migrations...');
  await run('npx', ['prisma', 'migrate', 'deploy']);

  console.log('Starting Next.js server...');
  await run('npx', ['next', 'start']);
}

main().catch((error) => {
  console.error('Startup failed.');
  console.error(error);
  process.exit(1);
});
