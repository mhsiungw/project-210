import { PrismaClient } from '../generated/client/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })

export { PrismaClient } from '../generated/client/client.ts'
export type { Book, Translation } from '../generated/client/client.ts'
