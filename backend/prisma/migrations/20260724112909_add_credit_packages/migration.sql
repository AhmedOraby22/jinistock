-- CreateTable
CREATE TABLE "CreditPackage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL,
    "image_credits" INTEGER NOT NULL,
    "video_credits" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditPackage_slug_key" ON "CreditPackage"("slug");

-- CreateIndex
CREATE INDEX "CreditPackage_active_sort_order_idx" ON "CreditPackage"("active", "sort_order");
