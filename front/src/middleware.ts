import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from '@/lib/admin/session';
import { expiryOf, renew, stillValid, type TokenPair } from '@/lib/admin/renew';

/**
 * Garde d'entrée du back-office, et renouvellement de la session.
 *
 * Deux responsabilités, toutes deux impossibles ailleurs.
 *
 * 1. **Ne jamais détourner /admin/login.** Le middleware ne détient pas le
 *    secret de signature : un jeton peut exister tout en étant expiré. Rediriger
 *    au seul vu du cookie provoquait une boucle avec le gabarit, qui constatait
 *    l'invalidité et renvoyait au formulaire.
 *
 * 2. **Renouveler le jeton d'accès ici.** Il expire au bout de quinze minutes.
 *    Le renouveler depuis un composant serveur est impossible : Next y interdit
 *    l'écriture de cookies, et l'échec se traduisait par une déconnexion en
 *    pleine session. Le middleware, lui, peut écrire sur la réponse — et
 *    réinjecter le jeton frais dans la requête pour le rendu qui suit.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === '/admin/login') {
    const response = NextResponse.next();

    // Le gabarit nous adresse ici avec ce marqueur quand la session ne vaut
    // plus rien : on purge, pour repartir d'une page propre.
    if (searchParams.get('session') === 'expiree') {
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
    }

    return response;
  }

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!access && !refresh) return toLogin(request);
  if (stillValid(access)) return NextResponse.next();

  // Jeton d'accès absent, illisible ou sur le point d'expirer.
  if (!refresh) return toLogin(request);

  let renewed: TokenPair | null;
  try {
    renewed = await renew(refresh);
  } catch {
    // API injoignable : on laisse passer sans toucher aux cookies. Le rendu
    // affichera son erreur, mais la session n'est pas perdue pour autant.
    return NextResponse.next();
  }

  // Refus de l'API : la session est finie, sauf si le jeton d'accès a encore
  // de la marge — auquel cas on n'anticipait qu'un renouvellement, et il n'y a
  // aucune raison de déconnecter qui que ce soit.
  if (!renewed) {
    const expiry = expiryOf(access);
    const now = Math.floor(Date.now() / 1000);
    return expiry !== null && expiry > now ? NextResponse.next() : expiredSession(request);
  }

  // Le rendu qui suit doit voir le jeton frais, pas celui du navigateur.
  request.cookies.set(ACCESS_COOKIE, renewed.accessToken);
  request.cookies.set(REFRESH_COOKIE, renewed.refreshToken);

  const response = NextResponse.next({ request });
  response.cookies.set(ACCESS_COOKIE, renewed.accessToken, cookieOptions());
  response.cookies.set(REFRESH_COOKIE, renewed.refreshToken, cookieOptions());

  return response;
}

function toLogin(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const login = new URL('/admin/login', request.url);
  // On mémorise la destination pour y revenir après connexion.
  if (pathname !== '/admin') login.searchParams.set('suite', pathname + search);
  return NextResponse.redirect(login);
}

function expiredSession(request: NextRequest) {
  const login = new URL('/admin/login', request.url);
  login.searchParams.set('session', 'expiree');
  const response = NextResponse.redirect(login);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
