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

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
```
