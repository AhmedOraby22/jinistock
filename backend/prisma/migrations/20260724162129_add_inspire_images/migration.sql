-- CreateTable
CREATE TABLE "InspireImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "title" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspireImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InspireImage_active_sort_order_idx" ON "InspireImage"("active", "sort_order");
