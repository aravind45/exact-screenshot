import { Prisma } from "@prisma/client";

export const isMissingColumnError = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2022";
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("column") && message.toLowerCase().includes("does not exist");
};

export const getPrismaErrorDetails = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      code: error.code,
      clientVersion: error.clientVersion,
      meta: error.meta
    };
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      clientVersion: error.clientVersion
    };
  }

  return {};
};
