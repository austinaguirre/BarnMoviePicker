// app/api/picks/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const query = `
    SELECT 
      tp.id AS "pickId",
      m.id AS "movieId",
      m.title,
      m.genre,
      m.addedBy,
      tp.addedBy AS "pickedBy",
      (1 + COALESCE((SELECT COUNT(*) FROM todays_picks_upvotes up WHERE up.pickId = tp.id), 0)) AS weight,
      COALESCE(json_agg(u.userId) FILTER (WHERE u.userId IS NOT NULL), '[]') AS upvoters
    FROM todays_picks tp
    JOIN movies m ON tp.movieId = m.id
    LEFT JOIN todays_picks_upvotes u ON u.pickId = tp.id
    GROUP BY tp.id, m.id, m.title, m.genre, m.addedBy
  `;
  const { rows } = await db.query(query);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const { movieId, addedby } = await request.json();

    if (!movieId || !addedby) {
      return NextResponse.json(
        { error: 'movieId and addedby are required' },
        { status: 400 }
      );
    }

    // 1) Check if this user already has a pick in todays_picks
    const checkUserQuery = `SELECT COUNT(*) AS count FROM todays_picks WHERE addedby = $1`;
    const checkResult = await db.query(checkUserQuery, [addedby]);
    const userCount = Number(checkResult.rows[0].count);

    if (userCount > 0) {
      // This user already has a pick
      return NextResponse.json(
        { error: 'You already have a movie in Today’s Picks!' },
        { status: 409 }
      );
    }

    // 2) Insert the new pick (with addedby)
    const insertQuery = `
      INSERT INTO todays_picks (movieId, addedby)
      VALUES ($1, $2)
      RETURNING *
    `;
    const insertResult = await db.query(insertQuery, [movieId, addedby]);
    const newPick = insertResult.rows[0];

    // 3) Optionally join with movie details or just return newPick
    return NextResponse.json(newPick);

  } catch (error: any) {
    console.error('[POST /api/picks] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // We remove ALL rows in todays_picks
    await db.query('DELETE FROM todays_picks');
    await db.query('delete from todays_picks_upvotes')
    return NextResponse.json({ message: 'All picks cleared' });
  } catch (error: any) {
    console.error('DELETE /api/picks (all) error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

