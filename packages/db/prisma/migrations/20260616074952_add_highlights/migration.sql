-- CreateTable
CREATE TABLE "highlights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "book_id" UUID NOT NULL,
    "page" INTEGER NOT NULL,
    "rects" JSONB NOT NULL,
    "text" TEXT NOT NULL,
    "note" TEXT,
    "color" TEXT,

    CONSTRAINT "highlights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "highlights_book_id_page_idx" ON "highlights"("book_id", "page");

-- AddForeignKey
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
