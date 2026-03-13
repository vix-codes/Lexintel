# Lexintel

Lexintel is a Next.js legal-assist app with Prisma, PostgreSQL, and Genkit.

## Stack

- Next.js 15
- React 18
- TypeScript
- Prisma ORM
- PostgreSQL
- Genkit / Google GenAI

## Environment Variables

Create a local `.env` file from `.env.example` and set:

```bash
DATABASE_URL=postgresql://postgres:your_url_encoded_password@your-rds-endpoint:5432/your_database
SESSION_SECRET=replace-with-a-long-random-secret
GEMINI_API_KEY=replace-with-your-gemini-api-key
```

If your database password contains special characters like `(`, `)`, `$`, `#`, `]`, or `@`, URL-encode the password portion before building `DATABASE_URL`.

## Local Development

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migrations in development:

```bash
npm run prisma:migrate
```

Start the app:

```bash
npm run dev
```

## Production Behavior

Production startup is handled by `npm start`, which does the following:

1. Checks that `DATABASE_URL` exists
2. Verifies PostgreSQL connectivity
3. Runs `prisma migrate deploy`
4. Starts `next start`

That means a single deploy can fully boot the app as long as the environment variables are configured correctly.

## AWS Deployment

Recommended target:

- AWS App Runner for the app
- AWS RDS PostgreSQL for the database

This repo also supports a plain Ubuntu or EC2 deploy with PM2.

Required app environment variables:

- `DATABASE_URL`
- `SESSION_SECRET`
- `GEMINI_API_KEY`

Recommended `DATABASE_URL` format:

```bash
postgresql://postgres:your_url_encoded_password@your-rds-endpoint:5432/your_database
```

Notes:

- Make sure the App Runner service can reach the RDS instance.
- Make sure the RDS security group allows inbound traffic from the app path you are using.
- Do not commit real secrets into the repository.

## Ubuntu / EC2 Deployment

On a fresh Ubuntu server:

```bash
sudo apt update
sudo apt install nodejs npm git -y
git clone <your-repo-url>
cd <your-repo-folder>
npm install
npm run build
```

Create `.env` with at least:

```bash
DATABASE_URL=postgresql://postgres:your_url_encoded_password@your-rds-endpoint:5432/your_database
SESSION_SECRET=replace-with-a-long-random-secret
GEMINI_API_KEY=replace-with-your-gemini-api-key
```

Start once:

```bash
npm start
```

Keep it running with PM2:

```bash
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

The production startup flow will:

1. Validate `DATABASE_URL`
2. Check PostgreSQL connectivity
3. Run `prisma migrate deploy`
4. Start Next.js on `0.0.0.0:3000`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
```
