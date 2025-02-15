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
        u.username as "addedby"
        FROM current_pick cp
        JOIN todays_picks tp ON cp.pickId = tp.id
        JOIN movies m ON tp.movieId = m.id
        join users u on m.addedby = u.id
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
      addedby: row.addedby,
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
    // 1) Get picks with weight
    const picksQuery = `
      SELECT 
        tp.id AS "pickId", 
        m.id AS "movieId",
        (1 + COALESCE((
          SELECT COUNT(*) 
          FROM todays_picks_upvotes up 
          WHERE up.pickId = tp.id
        ),0)) AS "weight"
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

    // 2) Build Weighted Array
    //    e.g. if pickId=7 has weight=2, we push {pickId:7,movieId:...} twice.
    const weightedArray: typeof picks[number][] = [];
    picks.forEach((p) => {
      const w = Number(p.weight);
      for (let i = 0; i < w; i++) {
        weightedArray.push(p);
      }
    });

    if (weightedArray.length === 0) {
      // In case all had weight=0, which shouldn't happen if there's at least 1 pick
      return NextResponse.json(
        { error: 'No weighted picks available to choose from.' },
        { status: 400 }
      );
    }
    // 3) Choose one item from the weighted array
    const randomIndex = Math.floor(Math.random() * weightedArray.length);
    const chosenPick = weightedArray[randomIndex];
    const chosenPickId = chosenPick.pickId;

    // 4) Upsert into current_pick with id=1
    const upsertQuery = `
      INSERT INTO current_pick (id, pickId, chosenAt)
      VALUES (1, $1, NOW())
      ON CONFLICT (id)
      DO UPDATE SET pickId = EXCLUDED.pickId, chosenAt = EXCLUDED.chosenAt
      RETURNING *;
    `;
    await db.query(upsertQuery, [chosenPickId]);

    // 5) Return the newly chosen pick's details
    //    We can do a final join to get the movie info
    const fetchQuery = `
      SELECT 
        cp.id AS "currentPickId",
        cp.chosenAt,
        tp.id AS "pickId",
        m.id AS "movieId",
        m.title,
        m.genre,
        u.username as "addedby"
      FROM current_pick cp
      JOIN todays_picks tp ON cp.pickId = tp.id
      JOIN movies m ON tp.movieId = m.id
      join users u on m.addedby = u.id
      WHERE cp.id = 1
    `;
    const { rows } = await db.query(fetchQuery);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Pick not found?' }, { status: 404 });
    }
    const row = rows[0];

    return NextResponse.json({
      pickId: row.pickId,
      movieId: row.movieId,
      title: row.title,
      genre: row.genre,
      addedby: row.addedby,
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
