-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'CONTRIBUTOR');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('INSTITUTION', 'ENTERPRISE', 'FOUNDATION', 'NGO');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('PENDING', 'READ', 'REPLIED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DonationMethod" AS ENUM ('MOBILE_MONEY', 'BANK_TRANSFER', 'CARD');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "VolunteerStatus" AS ENUM ('PENDING', 'CONTACTED', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('COMMUNIQUE', 'TERRAIN', 'PARTENARIAT', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "TestimonialType" AS ENUM ('BENEFICIARY', 'VOLUNTEER', 'PARTNER');

-- CreateEnum
CREATE TYPE "DonationFrequency" AS ENUM ('ONE_TIME', 'MONTHLY');

-- CreateEnum
CREATE TYPE "MissionKind" AS ENUM ('FIELD', 'SKILLS');

-- CreateEnum
CREATE TYPE "MediaBucket" AS ENUM ('BRAND', 'PROGRAMS', 'PROJECTS', 'NEWS', 'TESTIMONIALS', 'PARTNERS', 'FIELD');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('MISSING', 'PENDING', 'GRANTED', 'REFUSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ConsentKind" AS ENUM ('WRITTEN', 'RECORDED_ORAL', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "ConsentScope" AS ENUM ('WEB', 'PRESS', 'SOCIAL', 'PRINT');

-- CreateEnum
CREATE TYPE "SettingGroup" AS ENUM ('GENERAL', 'CONTACT', 'SOCIAL', 'PAYMENT', 'ANALYTICS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "image" TEXT,
    "content" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT,
    "programId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "location" TEXT,
    "image" TEXT,
    "gallery" TEXT[],
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impacts" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "category" "NewsCategory" NOT NULL DEFAULT 'TERRAIN',
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "type" "TestimonialType" NOT NULL DEFAULT 'BENEFICIARY',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "website" TEXT,
    "type" "PartnerType" NOT NULL DEFAULT 'INSTITUTION',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT,
    "image" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "image" TEXT,
    "goal" DOUBLE PRECISION NOT NULL,
    "raised" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "programId" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_missions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "MissionKind" NOT NULL DEFAULT 'FIELD',
    "commitment" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'PDF',
    "fileSize" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorEmail" TEXT NOT NULL,
    "donorPhone" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "method" "DonationMethod" NOT NULL,
    "frequency" "DonationFrequency" NOT NULL DEFAULT 'ONE_TIME',
    "programId" TEXT,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "availability" TEXT,
    "skills" TEXT[],
    "message" TEXT,
    "missionId" TEXT,
    "status" "VolunteerStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnership_requests" (
    "id" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "intent" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partnership_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "bucket" "MediaBucket" NOT NULL,
    "objectKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "title" TEXT,
    "altText" TEXT,
    "credit" TEXT,
    "tags" TEXT[],
    "capturedAt" TIMESTAMP(3),
    "capturedPlace" TEXT,
    "consentStatus" "ConsentStatus" NOT NULL DEFAULT 'MISSING',
    "consentKind" "ConsentKind",
    "consentScopes" "ConsentScope"[],
    "consentSignedBy" TEXT,
    "consentIsGuardian" BOOLEAN NOT NULL DEFAULT false,
    "consentSignedAt" TIMESTAMP(3),
    "consentExpiresAt" TIMESTAMP(3),
    "consentNotes" TEXT,
    "consentProofUrl" TEXT,
    "showInGallery" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "group" "SettingGroup" NOT NULL DEFAULT 'GENERAL',
    "value" JSONB NOT NULL,
    "label" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "programs_slug_key" ON "programs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_programId_idx" ON "projects"("programId");

-- CreateIndex
CREATE INDEX "impacts_projectId_idx" ON "impacts"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_key" ON "news"("slug");

-- CreateIndex
CREATE INDEX "news_authorId_idx" ON "news"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE INDEX "campaigns_programId_idx" ON "campaigns"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_missions_slug_key" ON "volunteer_missions"("slug");

-- CreateIndex
CREATE INDEX "donations_programId_idx" ON "donations"("programId");

-- CreateIndex
CREATE INDEX "volunteers_missionId_idx" ON "volunteers"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_objectKey_key" ON "media_assets"("objectKey");

-- CreateIndex
CREATE INDEX "media_assets_bucket_idx" ON "media_assets"("bucket");

-- CreateIndex
CREATE INDEX "media_assets_uploadedById_idx" ON "media_assets"("uploadedById");

-- CreateIndex
CREATE INDEX "settings_group_idx" ON "settings"("group");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impacts" ADD CONSTRAINT "impacts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "volunteer_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
