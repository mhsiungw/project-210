-- CreateTable
CREATE TABLE "books" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_pages" INTEGER,
    "current_page" INTEGER,
    "url" TEXT NOT NULL DEFAULT '',
    "file_name" TEXT NOT NULL DEFAULT '',
    "preview_url" TEXT NOT NULL DEFAULT '',
    "key" TEXT NOT NULL DEFAULT '',
    "preview_key" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "book_id" UUID,
    "text" TEXT,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "translations" ADD CONSTRAINT "translations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
