-- Rattache un don a la cause qu'il soutient.
--
-- Sans ce lien, le montant collecte d'une cause restait la valeur saisie a la
-- main : la jauge ne bougeait jamais, quels que soient les dons recus.
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "campaignId" TEXT;

CREATE INDEX IF NOT EXISTS "donations_campaignId_idx" ON "donations"("campaignId");

ALTER TABLE "donations"
  ADD CONSTRAINT "donations_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
