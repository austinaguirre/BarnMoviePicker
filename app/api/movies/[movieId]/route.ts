// app/api/movies/[movieId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { movieId: string } }
) {
  const { movieId } = params;
  const query = 'DELETE FROM movies WHERE id = $1 RETURNING *';
  const { rows } = await db.query(query, [movieId]);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Movie deleted' });
}

// We'll ignore the second argument altogether
export async function PATCH(request: NextRequest) {
  try {
    // 1) Parse the movieId from the pathname itself
    //    e.g. /api/movies/123 => last segment "123"
    const pathParts = request.nextUrl.pathname.split("/");
    const lastSegment = pathParts[pathParts.length - 1];
    const movieIdNum = parseInt(lastSegment, 10);

    // 2) Extract { watched } from the request body
    const { watched } = await request.json();
    if (typeof watched !== "boolean") {
      return new Response(
        JSON.stringify({ error: "watched must be a boolean" }),
        { status: 400 }
      );
    }

    // 3) Update DB
    const query = `
      UPDATE movies
      SET watched = $1
      WHERE id = $2
      RETURNING *
    `;
    const values = [watched, movieIdNum];
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "Movie not found" }), {
        status: 404,
      });
    }

    // 4) Return updated row
    return new Response(JSON.stringify(rows[0]), { status: 200 });
  } catch (error: any) {
    console.error("[PATCH /api/movies/[movieId]] error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

