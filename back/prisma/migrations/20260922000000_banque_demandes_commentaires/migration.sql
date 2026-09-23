-- Demandes deposees depuis le site (apporter / recevoir) et mots des
-- beneficiaires.
--
-- Le stock ne bouge pas au depot : il bouge a la validation, qui cree un
-- mouvement et le rattache a la demande.

CREATE TYPE "FoodbankRequestKind" AS ENUM ('DON', 'RETRAIT');
CREATE TYPE "FoodbankRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "foodbank_requests" (
    "id" TEXT NOT NULL,
    "kind" "FoodbankRequestKind" NOT NULL,
    "status" "FoodbankRequestStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "otherLabel" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "message" TEXT,
    "movementId" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "foodbank_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "foodbank_requests_movementId_key" ON "foodbank_requests"("movementId");
CREATE INDEX "foodbank_requests_kind_status_idx" ON "foodbank_requests"("kind", "status");
CREATE INDEX "foodbank_requests_createdAt_idx" ON "foodbank_requests"("createdAt");

ALTER TABLE "foodbank_requests"
  ADD CONSTRAINT "foodbank_requests_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "food_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "foodbank_requests"
  ADD CONSTRAINT "foodbank_requests_movementId_fkey"
  FOREIGN KEY ("movementId") REFERENCES "stock_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "foodbank_comments" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "foodbank_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "foodbank_comments_isPublished_createdAt_idx" ON "foodbank_comments"("isPublished", "createdAt");
