-- CreateEnum
CREATE TYPE "MovementDirection" AS ENUM ('ENTREE', 'SORTIE');

-- AlterTable
ALTER TABLE "seasonal_campaigns" ALTER COLUMN "bannerText" DROP NOT NULL;

-- CreateTable
CREATE TABLE "food_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "examples" TEXT,
    "target" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lowLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "criticalLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "direction" "MovementDirection" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "counterpart" TEXT NOT NULL,
    "detail" TEXT,
    "peopleServed" INTEGER,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "food_categories_slug_key" ON "food_categories"("slug");

-- CreateIndex
CREATE INDEX "stock_movements_categoryId_idx" ON "stock_movements"("categoryId");

-- CreateIndex
CREATE INDEX "stock_movements_occurredAt_idx" ON "stock_movements"("occurredAt");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "food_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

