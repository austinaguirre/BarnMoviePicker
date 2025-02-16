// app/api/picks/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.groupId) { return NextResponse.json({ error: "Not logged in or no group." }, { status: 401 }); }
  const rawGroupId = (session.user as any).groupId; // e.g. "3"
  const groupId = parseInt(rawGroupId, 10);
  const query = `
SELECT 
    tp.id AS "pickId",
    m.id AS "movieId",
    m.title,
    m.genre,
    um.username as "addedby",
    upu.username as "pickedBy",

    (1 + COALESCE(
      (SELECT COUNT(*) FROM todays_picks_upvotes up2 WHERE up2.pickId = tp.id),
      0
    )) AS weight,

    COALESCE(
      JSON_AGG(uu.username) FILTER (WHERE uu.username IS NOT NULL),
      '[]'
    ) AS upvoters

  FROM todays_picks tp
  JOIN movies m ON tp.movieId = m.id
  JOIN users um ON m.addedby = um.id
  JOIN users upu ON tp.addedby = upu.id
  LEFT JOIN todays_picks_upvotes up ON up.pickId = tp.id
  LEFT JOIN users uu ON up.userId = uu.id
  WHERE tp.groupid = $1
  GROUP BY tp.id, m.id, um.id, upu.id

  `;
  const { rows } = await db.query(query, [groupId]);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  try {
    const { movieId, addedby, groupid } = await request.json();

    if (!movieId || !addedby || !groupid) {
      return NextResponse.json(
        { error: 'movieId and addedby and groupid are required' },
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
      INSERT INTO todays_picks (movieId, addedby, groupid)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const insertResult = await db.query(insertQuery, [movieId, addedby, groupid]);
    const newPick = insertResult.rows[0];

    // 3) Optionally join with movie details or just return newPick
    return NextResponse.json(newPick);

  } catch (error: any) {
    console.error('[POST /api/picks] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.groupId) { return NextResponse.json({ error: "Not logged in or no group." }, { status: 401 }); }
  const groupId = (session.user as any).groupId;

  try {
    // We remove ALL rows in todays_picks
    await db.query('DELETE FROM todays_picks where groupid = $1', [groupId]);
    await db.query('delete from todays_picks_upvotes where groupid = $1', [groupId])
    return NextResponse.json({ message: 'All picks cleared' });
  } catch (error: any) {
    console.error('DELETE /api/picks (all) error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

