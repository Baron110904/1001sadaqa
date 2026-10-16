-- Code a presenter au moment du retrait.
--
-- Delivre des le depot, et seulement pour un retrait : qui apporte des denrees
-- n'a rien a venir chercher. L'application mobile le garde sur l'appareil et
-- l'association le retrouve au back-office pour reconnaitre la personne.
--
-- Nullable : les demandes deja enregistrees n'en ont pas, et les apports n'en
-- auront jamais. Unique pour qu'un code designe une demande et une seule.

ALTER TABLE "foodbank_requests" ADD COLUMN IF NOT EXISTS "pickupCode" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "foodbank_requests_pickupCode_key"
  ON "foodbank_requests"("pickupCode");
