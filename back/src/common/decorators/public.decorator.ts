import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Ouvre une route au public. Le JwtAuthGuard est appliqué globalement :
 * sans ce décorateur, une route exige un jeton d'accès valide.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
