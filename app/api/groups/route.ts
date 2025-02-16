// app/api/groups/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Group name required" }, { status: 400 });
    }

    // 1) Check if group already exists
    const checkQuery = "SELECT id FROM groups WHERE name = $1";
    const { rows: existing } = await db.query(checkQuery, [name]);
    if (existing.length > 0) {
      return NextResponse.json({
        error: "Group name already taken",
      }, { status: 409 });
    }

    // 2) Insert the group
    const insertQuery = `
      INSERT INTO groups (name) VALUES ($1)
      RETURNING id, name
    `;
    const { rows } = await db.query(insertQuery, [name]);
    const group = rows[0];

    return NextResponse.json(group);
  } catch (err: any) {
    console.error("Create group error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.groupId) { return NextResponse.json({ error: "Not logged in or no group." }, { status: 401 });}
  const groupId = (session.user as any).groupId;
  
  // Fetch all movies from DB
  // Instead of SELECT *, do a JOIN to fetch username
  const query = `
    SELECT *
    FROM groups g
    where g.id = $1
  `;
  const { rows } = await db.query(query, [groupId]);
  return NextResponse.json(rows);
}
