import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAnonIdFromRequest } from "@/lib/anon-id";

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function getOwnedThread(req: NextRequest, id: string) {
  const anonId = getAnonIdFromRequest(req);
  if (!anonId) return { error: errorResponse(401, "unauthorized", "Missing cookie") };
  const thread = await prisma.thread.findUnique({ where: { id } });
  if (!thread) return { error: errorResponse(404, "not_found", "Thread not found") };
  if (thread.anonymousId !== anonId)
    return { error: errorResponse(403, "forbidden", "Not your thread") };
  return { thread };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const r = await getOwnedThread(req, id);
  if (r.error) return r.error;
  return NextResponse.json(r.thread);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const r = await getOwnedThread(req, id);
  if (r.error) return r.error;
  const body = (await req.json()) as { title?: string; archivedAt?: string | null };
  const updated = await prisma.thread.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title.slice(0, 255) } : {}),
      ...(body.archivedAt !== undefined
        ? { archivedAt: body.archivedAt ? new Date(body.archivedAt) : null }
        : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const r = await getOwnedThread(req, id);
  if (r.error) return r.error;
  await prisma.thread.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
