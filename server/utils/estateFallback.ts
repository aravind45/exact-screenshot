import { PrismaClient } from "@prisma/client";

export const fetchEstateRowById = async (
  client: PrismaClient,
  estateId: string
): Promise<Record<string, unknown> | null> => {
  const estate = await client.estate.findUnique({
    where: { id: estateId }
  });

  if (!estate) return null;

  return estate as unknown as Record<string, unknown>;
};

export const fetchEstateRowForUser = async (
  client: PrismaClient,
  userId: string
): Promise<Record<string, unknown> | null> => {
  const estate = await client.estate.findFirst({
    where: {
      OR: [
        { userId: userId },
        { grants: { some: { userId: userId } } }
      ]
    },
    orderBy: { createdAt: "desc" }
  });

  if (!estate) return null;

  return estate as unknown as Record<string, unknown>;
};
