/*
  Warnings:

  - A unique constraint covering the columns `[book_id]` on the table `translations` will be added. If there are existing duplicate values, this will fail.
  - Made the column `book_id` on table `translations` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "translations" DROP CONSTRAINT "translations_book_id_fkey";

-- AlterTable
ALTER TABLE "translations" ALTER COLUMN "book_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "translations_book_id_key" ON "translations"("book_id");

-- AddForeignKey
ALTER TABLE "translations" ADD CONSTRAINT "translations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
