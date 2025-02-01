// app/api/movies/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  // Fetch all movies from DB
  const query = 'SELECT * FROM movies';
  const { rows } = await db.query(query);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  // Add new movie
  const { title, genre, addedby, watched } = await request.json();
  if (!title || !genre || !addedby) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const isWatched = watched === true;

  const query = 'INSERT INTO movies (title, genre, addedby, watched) VALUES ($1, $2, $3, $4) RETURNING *';
  const values = [title, genre, addedby, isWatched];
  const { rows } = await db.query(query, values);
  
  return NextResponse.json(rows[0]);
}

