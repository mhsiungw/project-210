import { prisma, type Book } from '@app/db'

// Authorization helper shared by resource handlers.
//
//   request ──> findOwnedBook(userId, bookId) ──> book | null
//                       │
//                       └─ null  => caller returns 404 (never leak existence)
//
// This is the app's real enforcement boundary: there is no Postgres RLS, so
// every read/write of a per-book resource must prove ownership here. Mirrors
// the inline `where: { id, user_id }` checks in functions/books.ts.

/** Returns the book iff it exists AND belongs to userId, else null. */
export const findOwnedBook = (userId: string, bookId: string): Promise<Book | null> =>
  prisma.book.findFirst({ where: { id: bookId, user_id: userId } })
