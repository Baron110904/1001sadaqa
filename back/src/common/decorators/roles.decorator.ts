import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restreint une route à certains rôles. Traduit les niveaux de validation du
 * cahier des charges : niveau 1 (contenus courants) → EDITOR,
 * niveaux 2 et 3 (contenus institutionnels et sensibles) → ADMIN.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
