-- État d'avancement d'un programme, distinct de l'interrupteur de publication
-- `isActive`. Les programmes existants sont tous en activité.

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ACTIF', 'EN_PREPARATION');

-- AlterTable
ALTER TABLE "programs" ADD COLUMN "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIF';
