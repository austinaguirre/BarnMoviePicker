// app/api/register/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
// import bcrypt from 'bcrypt'; // if you want real password hashing
import { checkForBannedWords } from '@/lib/checkForBannedWords';

export async function POST(request: Request) {
  try {
    const { username, password, group } = await request.json();
    console.log(username, password, group)

    if (!username || !password || !group) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (checkForBannedWords(username)) {
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

    let groupId: number;
    {
      const checkGroupSql = 'SELECT id FROM groups WHERE name=$1';
      const { rows: groupRows } = await db.query(checkGroupSql, [group]);
      if (groupRows.length > 0) {
        groupId = groupRows[0].id;
      } else {
        // Return an error if no group is found
        return NextResponse.json(
          { error: "No such group found. Please create it first." },
          { status: 400 }
        );
      }
    }

    // Insert user
    // const hash = await bcrypt.hash(password, 10);
    // For demo only (plain password):
    const insertQuery =
      'INSERT INTO users (username, password, groupid) VALUES ($1, $2, $3) RETURNING id';
    await db.query(insertQuery, [username, password, groupId]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
