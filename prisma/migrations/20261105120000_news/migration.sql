-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "titleKa" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyKa" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "image" TEXT,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);
