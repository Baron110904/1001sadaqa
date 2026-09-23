-- AlterTable
ALTER TABLE "news" ADD COLUMN     "imageCaption" TEXT,
ADD COLUMN     "imageCredit" TEXT,
ADD COLUMN     "programId" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "videos" TEXT[];

-- CreateTable
CREATE TABLE "newsletter_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "policyVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_isActive_idx" ON "newsletter_subscriptions"("isActive");

-- CreateIndex
CREATE INDEX "partner_documents_projectId_idx" ON "partner_documents"("projectId");

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_documents" ADD CONSTRAINT "partner_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_documents" ADD CONSTRAINT "partner_documents_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
