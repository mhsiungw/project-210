import { PrismaClient } from '../generated/client/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })

export { PrismaClient, Prisma } from '../generated/client/client.ts'
export type { Book, Translation, Highlight } from '../generated/client/client.ts'
export type { BookDto, TranslationDto, HighlightDto, HighlightRect } from './dto.ts'
