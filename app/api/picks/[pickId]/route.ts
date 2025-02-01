// app/api/picks/[pickId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  try {
    // 1) Parse the pickId from the last URL segment
    //    e.g. "/api/picks/7" => last segment "7"
    const pathParts = request.nextUrl.pathname.split("/");
    const lastSegment = pathParts[pathParts.length - 1];
    const pickIdNum = parseInt(lastSegment, 10);

    // 2) Delete row from DB
    const query = "DELETE FROM todays_picks WHERE id = $1 RETURNING *";
    const { rows } = await db.query(query, [pickIdNum]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Pick not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Pick removed" }, { status: 200 });
  } catch (error: any) {
    console.error("[DELETE /api/picks/[pickId]] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
