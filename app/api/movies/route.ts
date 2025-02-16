// app/api/movies/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkForBannedWords } from '@/lib/checkForBannedWords';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.groupId) { return NextResponse.json({ error: "Not logged in or no group." }, { status: 401 });}
  const groupId = (session.user as any).groupId;
  
  // Fetch all movies from DB
  // Instead of SELECT *, do a JOIN to fetch username
  const query = `
    SELECT
      m.id,
      m.title,
      m.genre,
      u.username AS "addedby",
      m.watched
    FROM movies m
    JOIN users u ON m.addedby = u.id
    where m.groupid = $1
  `;
  const { rows } = await db.query(query, [groupId]);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  // Add new movie
  const { title, genre, addedby, watched, groupId } = await request.json();
  if (!title || !genre || !addedby || !groupId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (checkForBannedWords(title)) {
    return NextResponse.json(
      { error: "Your title contains inappropriate language." },
      { status: 400 }
    );
  }
  if (checkForBannedWords(genre)) {
    return NextResponse.json(
      { error: "Your genre contains inappropriate language." },
      { status: 400 }
    );
  }

  const isWatched = watched === true;

  const query = 'INSERT INTO movies (title, genre, addedby, watched, groupid) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  const values = [title, genre, addedby, isWatched, groupId];
  const { rows } = await db.query(query, values);

  return NextResponse.json(rows[0]);
}

