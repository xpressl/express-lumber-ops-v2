import { apiHandler, jsonResponse } from "@/lib/middleware/api-handler";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updatePreferenceSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

export const GET = apiHandler(async (_request, { user }) => {
  const prefs = await prisma.userPreference.findMany({
    where: { userId: user.id },
    orderBy: { key: "asc" },
  });
  const result: Record<string, unknown> = {};
  for (const p of prefs) {
    result[p.key] = p.value;
  }
  return jsonResponse(result);
});

export const PUT = apiHandler(async (request, { user }) => {
  const body = await request.json();
  const parsed = updatePreferenceSchema.parse(body);

  await prisma.userPreference.upsert({
    where: { userId_key: { userId: user.id, key: parsed.key } },
    update: { value: parsed.value as Prisma.InputJsonValue },
    create: { userId: user.id, key: parsed.key, value: parsed.value as Prisma.InputJsonValue },
  });

  return jsonResponse({ success: true });
});
