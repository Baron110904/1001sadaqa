-- Galerie des films de terrain, administrables depuis le back-office.
--
-- Le champ "videos" des projets ne portait que des adresses : impossible d'y
-- attacher un titre, une duree ou un sens de prise de vue. L'orientation n'est
-- pas un detail d'habillage, c'est elle qui decide du cadre : un film vertical
-- montre dans un cadre large s'afficherait cerne de bandes noires.

DO $$ BEGIN
  CREATE TYPE "VideoOrientation" AS ENUM ('PORTRAIT', 'LANDSCAPE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "videos" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "url"         TEXT NOT NULL,
  "poster"      TEXT,
  "orientation" "VideoOrientation" NOT NULL DEFAULT 'PORTRAIT',
  "duration"    INTEGER,
  "projectId"   TEXT,
  "place"       TEXT,
  "recordedAt"  TIMESTAMP(3),
  "order"       INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "videos_projectId_idx" ON "videos"("projectId");

-- Un projet supprime ne doit pas emporter ses films : la scene reste filmee,
-- elle perd seulement son rattachement.
ALTER TABLE "videos"
  ADD CONSTRAINT "videos_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
