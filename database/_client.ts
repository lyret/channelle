import { PrismaClient } from '@prisma/client';

/** Extended database client */
export const client = new PrismaClient();

/** Client type definition */
export type Client = typeof client;
