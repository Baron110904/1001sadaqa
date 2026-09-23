
-- CreateEnum
CREATE TYPE "BudgetVisibility" AS ENUM ('PUBLIC', 'PARTENAIRE', 'MASQUE');

-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('DISTRIBUTION', 'CAMPAGNE_SANTE', 'SENSIBILISATION', 'COLLECTE', 'JOURNEE_SOLIDAIRE');

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('PONCTUEL', 'ANNUEL', 'MENSUEL');

-- ──────────────────────────────────────────────────────────────────────────
-- Séparation de l'état d'avancement et de la publication.
--
-- L'ancienne énumération confondait les deux : un projet « à financer » ne
-- pouvait pas être montré au public sans être marqué « PUBLISHED », ce que le
-- guide (§5.2) demande pourtant. On ajoute donc « isPublished » d'abord, on le
-- renseigne depuis l'ancien état, puis on convertit l'énumération par
-- correspondance explicite — un simple cast de texte échouerait, les anciennes
-- valeurs n'existant pas dans la nouvelle.
-- ──────────────────────────────────────────────────────────────────────────

ALTER TABLE "projects" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;

UPDATE "projects" SET "isPublished" = true
  WHERE "status" IN ('PUBLISHED', 'COMPLETED');

-- AlterEnum
BEGIN;
CREATE TYPE "ProjectStatus_new" AS ENUM ('REALISE', 'EN_COURS', 'A_FINANCER', 'EN_PREPARATION');
ALTER TABLE "public"."projects" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "projects" ALTER COLUMN "status" TYPE "ProjectStatus_new" USING (
  (CASE "status"::text
     WHEN 'COMPLETED' THEN 'REALISE'
     WHEN 'PUBLISHED' THEN 'EN_COURS'
     WHEN 'DRAFT'     THEN 'EN_PREPARATION'
     WHEN 'CANCELLED' THEN 'EN_PREPARATION'
     ELSE 'EN_PREPARATION'
   END)::"ProjectStatus_new"
);
ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";
DROP TYPE "public"."ProjectStatus_old";
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'EN_PREPARATION';
COMMIT;

-- AlterTable
ALTER TABLE "programs" DROP COLUMN "content",
ADD COLUMN     "activities" TEXT[],
ADD COLUMN     "audience" TEXT,
ADD COLUMN     "context" TEXT,
ADD COLUMN     "domainId" TEXT,
ADD COLUMN     "objectives" TEXT,
ADD COLUMN     "outcomes" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "audience" TEXT,
ADD COLUMN     "budgetVisibility" "BudgetVisibility" NOT NULL DEFAULT 'MASQUE',
ADD COLUMN     "objectives" TEXT,
ADD COLUMN     "problem" TEXT,
ADD COLUMN     "progress" INTEGER,
ADD COLUMN     "progressAt" TIMESTAMP(3),
ADD COLUMN     "sdgs" INTEGER[],
ALTER COLUMN "status" SET DEFAULT 'EN_PREPARATION';

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "sdgs" INTEGER[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "programId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "kind" "EventKind" NOT NULL DEFAULT 'DISTRIBUTION',
    "description" TEXT NOT NULL,
    "figures" TEXT[],
    "image" TEXT,
    "gallery" TEXT[],
    "recurrence" "Recurrence" NOT NULL DEFAULT 'PONCTUEL',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domains_slug_key" ON "domains"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_programId_idx" ON "events"("programId");

-- CreateIndex
CREATE INDEX "programs_domainId_idx" ON "programs"("domainId");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

