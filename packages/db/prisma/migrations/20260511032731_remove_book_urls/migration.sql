/*
  Warnings:

  - You are about to drop the column `key` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `preview_key` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `preview_url` on the `books` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `books` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "books" DROP COLUMN "key",
DROP COLUMN "preview_key",
DROP COLUMN "preview_url",
DROP COLUMN "url",
ADD COLUMN     "s3_key" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "s3_preview_key" TEXT NOT NULL DEFAULT '';
