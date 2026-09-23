-- Pays et ville du donateur, choisis dans deux listes liees.
--
-- Nullables : les dons deja enregistres n'ont pas cette information, et la
-- rendre obligatoire retroactivement supposerait de l'inventer.
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "donorCountry" TEXT;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "donorCity" TEXT;
