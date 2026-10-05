-- Date de peremption d'une actualite.
--
-- Nullable : les articles existants n'en ont pas, et une actualite de fond
-- peut legitimement rester en ligne sans limite.
ALTER TABLE "news" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Index sur ce que lit le site : publie, date de publication passee, et non
-- perime. Sans lui, le filtre d'expiration ferait un parcours complet.
CREATE INDEX IF NOT EXISTS "news_isPublished_expiresAt_idx" ON "news"("isPublished", "expiresAt");
