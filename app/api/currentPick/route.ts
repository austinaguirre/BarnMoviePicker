import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/currentPick
 * 
 * Returns the currently chosen pick + its movie details, or null if none.
 */
export async function GET() {
  try {
    const query = `
        SELECT 
        cp.id AS "currentPickId",
        cp.chosenAt,
        tp.id AS "pickId",
        m.id AS "movieId",
        m.title,
        m.genre,
        m.addedBy
        FROM current_pick cp
        JOIN todays_picks tp ON cp.pickId = tp.id
        JOIN movies m ON tp.movieId = m.id
        WHERE cp.id = 1
    `;
    const { rows } = await db.query(query);

    if (rows.length === 0) {
      // Nothing selected yet
      return NextResponse.json(null);
    }

    // Return the single row
    const row = rows[0];
    return NextResponse.json({
      pickId: row.pickId,
      movieId: row.movieId,
      title: row.title,
      genre: row.genre,
      addedBy: row.addedby,
      chosenAt: row.chosenat,
    });
  } catch (error: any) {
    console.error('GET /currentPick error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/currentPick
 * 
 * Chooses a random pick from today's picks, updates current_pick,
 * and returns the chosen pick with movie details.
 */
export async function POST() {
  try {
    // 1) Get all picks
    const picksQuery = `
      SELECT tp.id AS pickId, m.id as movieId
      FROM todays_picks tp
      JOIN movies m ON tp.movieId = m.id
    `;
    const { rows: picks } = await db.query(picksQuery);

    if (picks.length === 0) {
      return NextResponse.json(
        { error: 'No picks available to choose from.' },
        { status: 400 }
      );
    }

    // 2) Choose one randomly
    const randomIndex = Math.floor(Math.random() * picks.length);
    const randomPick = picks[randomIndex];
    const chosenPickId = randomPick.pickid;

    // 3) Upsert into current_pick with id=1
    //    We "replace" the current row with the new pickId.
    //    In Postgres, we can do an ON CONFLICT for the primary key = 1.
    const upsertQuery = `
      INSERT INTO current_pick (id, pickId, chosenAt)
      VALUES (1, $1, NOW())
      ON CONFLICT (id)
      DO UPDATE SET pickId = EXCLUDED.pickId, chosenAt = EXCLUDED.chosenAt
      RETURNING *;
    `;
    const upsertResult = await db.query(upsertQuery, [chosenPickId]);

    // 4) Return the newly chosen pick's details
    //    We can do a join or reuse the existing randomPick data. 
    //    But let's do a final join to get the full movie details and chosenAt.
    const fetchQuery = `
      SELECT 
        cp.id AS currentPickId, 
        cp.chosenAt, 
        tp.id AS pickId,
        m.id AS movieId,
        m.title,
        m.genre,
        m.addedBy
      FROM current_pick cp
      JOIN todays_picks tp ON cp.pickId = tp.id
      JOIN movies m ON tp.movieId = m.id
      WHERE cp.id = 1
    `;
    const { rows } = await db.query(fetchQuery);
    const row = rows[0];

    return NextResponse.json({
      pickId: row.pickid,
      movieId: row.movieid,
      title: row.title,
      genre: row.genre,
      addedBy: row.addedby,
      chosenAt: row.chosenat,
    });
  } catch (error: any) {
    console.error('POST /currentPick error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/currentPick
 * 
 * Clears the current pick so that nothing is set.
 */
export async function DELETE() {
  try {
    // If you strictly use id=1 row:
    const query = `DELETE FROM current_pick WHERE id = 1`;
    await db.query(query);
    return NextResponse.json({ message: 'Current pick cleared.' });
  } catch (error: any) {
    console.error('DELETE /currentPick error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
