// app/api/register/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
// import bcrypt from 'bcrypt'; // if you want real password hashing
import { checkForBannedWords } from '@/lib/checkForBannedWords';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (checkForBannedWords(username)){
      return NextResponse.json(
        { error: "Your username contains inappropriate language." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE username = $1';
    const { rows: existing } = await db.query(checkQuery, [username]);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Insert user
    // const hash = await bcrypt.hash(password, 10);
    // For demo only (plain password):
    const insertQuery =
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id';
    await db.query(insertQuery, [username, password]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
