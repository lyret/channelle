import { PrismaClient } from '@prisma/client'

/** Extended database client */
export const client = new PrismaClient().$extends({
  result: {
    participant: {
      calculatedOnline: {
        needs: {},
        compute(participant) {
          return !!participant.online
        },
      },
    },
  },
})

/** Client type definition */
export type Client = typeof client
