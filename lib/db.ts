// lib/db.ts
import { createPool } from '@vercel/postgres';

export const db = createPool({
  connectionString: process.env.DATABASE_URL,
});
