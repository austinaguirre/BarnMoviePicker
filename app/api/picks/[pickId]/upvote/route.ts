// app/api/picks/[pickId]/upvote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 1) read user from body (or from session)
    const { userId, userName, userGroup } = await request.json();

    // 2) Parse pickId from the last URL segment
    // e.g. /api/picks/7/upvote => lastSegment is "upvote"
    // so we want the second-last segment if the path is exactly "picks/[pickId]/upvote"
    // let's do .slice(-2)[0] to get "7" from the pathParts
    const pathParts = request.nextUrl.pathname.split("/");
    // pathParts might be ["", "api", "picks", "7", "upvote"]
    // so the second-last is index -2
    const pickIdStr = pathParts.slice(-2)[0]; // "7" in this example
    const pickIdNum = parseInt(pickIdStr, 10);

    // 3) Check if user is already in todays_picks (they added a movie)
    // or if user has already upvoted something

    // a) Did user add a pick themselves?
    const userPickRes = await db.query(
      'SELECT id FROM todays_picks WHERE addedby = $1',
      [userId]
    );
    if (userPickRes.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already added a movie to Today’s Picks. Cannot upvote.' },
        { status: 409 }
      );
    }

    // b) Did user already upvote a pick?
    const userUpvoteRes = await db.query(
      'SELECT id FROM todays_picks_upvotes WHERE userId = $1',
      [userId]
    );
    if (userUpvoteRes.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already upvoted a pick. Cannot upvote again.' },
        { status: 409 }
      );
    }

    // 4) Insert row in todays_picks_upvotes
    const insertRes = await db.query(
      `INSERT INTO todays_picks_upvotes (pickId, userId, groupid) VALUES ($1, $2, $3) RETURNING *`,
      [pickIdNum, userId, userGroup]
    );
    const upvoteRow = insertRes.rows[0];

    // 5) Return success
    return NextResponse.json({
      message: 'Upvote successful.',
      upvote: upvoteRow,
    });
  } catch (error: any) {
    console.error('POST /api/picks/[pickId]/upvote error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
    try {
      const { userId } = await request.json();
  
      // parse pickId from URL
      const pathParts = request.nextUrl.pathname.split("/");
      const pickIdStr = pathParts.slice(-2)[0];
      const pickIdNum = parseInt(pickIdStr, 10);
  
      // remove row from todays_picks_upvotes
      const deleteUpvoteQuery = `
        DELETE FROM todays_picks_upvotes
        WHERE pickId = $1 AND userId = $2
        RETURNING *
      `;
      const { rows } = await db.query(deleteUpvoteQuery, [pickIdNum, userId]);
      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'Upvote not found or not yours to remove.' },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ message: 'Upvote removed.' });
    } catch (error: any) {
      console.error('DELETE /api/picks/[pickId]/upvote error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }