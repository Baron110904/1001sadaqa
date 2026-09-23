-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('EN_ATTENTE', 'ACTIF', 'SUSPENDU', 'RADIE');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ECHOUE');

-- CreateEnum
CREATE TYPE "RecordedBy" AS ENUM ('SYSTEME', 'TRESORERIE');

-- CreateEnum
CREATE TYPE "ContributionKind" AS ENUM ('FINANCIER', 'NATURE', 'COMPETENCES', 'LOGISTIQUE');

-- CreateEnum
CREATE TYPE "CampaignTheme" AS ENUM ('RAMADAN', 'TABASKI', 'AUCUN');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PUBLIC', 'PARTENAIRE', 'PRIVE');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "consentNews" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentNewsAt" TIMESTAMP(3),
ADD COLUMN     "consentPrivacy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentPrivacyAt" TIMESTAMP(3),
ADD COLUMN     "pageOrigin" TEXT,
ADD COLUMN     "policyVersion" TEXT,
ADD COLUMN     "trafficSource" TEXT;

-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "consentNews" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentNewsAt" TIMESTAMP(3),
ADD COLUMN     "consentPrivacy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentPrivacyAt" TIMESTAMP(3),
ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pageOrigin" TEXT,
ADD COLUMN     "policyVersion" TEXT,
ADD COLUMN     "trafficSource" TEXT;

-- AlterTable
ALTER TABLE "partner_documents" ADD COLUMN     "partnerId" TEXT,
ADD COLUMN     "programId" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "visibility" "DocumentVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "conventionFrom" TIMESTAMP(3),
ADD COLUMN     "conventionTo" TIMESTAMP(3),
ADD COLUMN     "isConventioned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "partners" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "partnership_requests" ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "consentNews" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentNewsAt" TIMESTAMP(3),
ADD COLUMN     "consentPrivacy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentPrivacyAt" TIMESTAMP(3),
ADD COLUMN     "orgType" TEXT,
ADD COLUMN     "pageOrigin" TEXT,
ADD COLUMN     "policyVersion" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "sector" TEXT,
ADD COLUMN     "trafficSource" TEXT;

-- AlterTable
ALTER TABLE "volunteers" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "consentNews" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentNewsAt" TIMESTAMP(3),
ADD COLUMN     "consentPrivacy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentPrivacyAt" TIMESTAMP(3),
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "pageOrigin" TEXT,
ADD COLUMN     "policyVersion" TEXT,
ADD COLUMN     "preference" TEXT,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "programId" TEXT,
ADD COLUMN     "trafficSource" TEXT;

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Bénin',
    "profession" TEXT,
    "interests" TEXT[],
    "motivation" TEXT,
    "participation" TEXT[],
    "pledgedAmount" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "status" "MemberStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "decisionNote" TEXT,
    "joinedAt" TIMESTAMP(3),
    "pageOrigin" TEXT,
    "trafficSource" TEXT,
    "campaign" TEXT,
    "consentPrivacy" BOOLEAN NOT NULL DEFAULT false,
    "consentPrivacyAt" TIMESTAMP(3),
    "consentNews" BOOLEAN NOT NULL DEFAULT false,
    "consentNewsAt" TIMESTAMP(3),
    "policyVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "method" "DonationMethod" NOT NULL DEFAULT 'MOBILE_MONEY',
    "providerRef" TEXT,
    "status" "ContributionStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "recordedBy" "RecordedBy" NOT NULL DEFAULT 'SYSTEME',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_seats" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Contact',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_contributions" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "kind" "ContributionKind" NOT NULL DEFAULT 'FINANCIER',
    "amount" DOUBLE PRECISION,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,
    "programId" TEXT,
    "status" "ContributionStatus" NOT NULL DEFAULT 'CONFIRME',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasonal_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "theme" "CampaignTheme" NOT NULL DEFAULT 'AUCUN',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "bannerText" TEXT NOT NULL,
    "bannerImage" TEXT,
    "ctaLabel" TEXT NOT NULL DEFAULT 'Je contribue',
    "ctaUrl" TEXT NOT NULL DEFAULT '/communaute/donateur',
    "goal" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasonal_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "members_accountId_key" ON "members"("accountId");

-- CreateIndex
CREATE INDEX "members_status_idx" ON "members"("status");

-- CreateIndex
CREATE INDEX "contributions_memberId_idx" ON "contributions"("memberId");

-- CreateIndex
CREATE INDEX "contributions_period_idx" ON "contributions"("period");

-- CreateIndex
CREATE INDEX "partner_seats_partnerId_idx" ON "partner_seats"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_seats_accountId_partnerId_key" ON "partner_seats"("accountId", "partnerId");

-- CreateIndex
CREATE INDEX "partner_contributions_partnerId_idx" ON "partner_contributions"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "seasonal_campaigns_slug_key" ON "seasonal_campaigns"("slug");

-- CreateIndex
CREATE INDEX "seasonal_campaigns_isActive_startsAt_endsAt_idx" ON "seasonal_campaigns"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "partner_documents_visibility_idx" ON "partner_documents"("visibility");

-- CreateIndex
CREATE INDEX "partner_documents_partnerId_idx" ON "partner_documents"("partnerId");

-- AddForeignKey
ALTER TABLE "partner_documents" ADD CONSTRAINT "partner_documents_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_seats" ADD CONSTRAINT "partner_seats_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_seats" ADD CONSTRAINT "partner_seats_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_contributions" ADD CONSTRAINT "partner_contributions_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

