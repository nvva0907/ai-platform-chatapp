import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonIdFromRequest } from "@/lib/anon-id";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: NextRequest) {
  const anonId = getAnonIdFromRequest(req);
  if (!anonId) return errorResponse(401, "unauthorized", "Missing anonymous cookie");
  const thread = await prisma.thread.create({
    data: { anonymousId: anonId },
  });
  return NextResponse.json({ id: thread.id }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const anonId = getAnonIdFromRequest(req);
  if (!anonId) return errorResponse(401, "unauthorized", "Missing anonymous cookie");
  const threads = await prisma.thread.findMany({
    where: { anonymousId: anonId, archivedAt: null },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      startedAt: true,
      lastMessageAt: true,
    },
  });
  return NextResponse.json({ threads });
}
