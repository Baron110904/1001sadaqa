/**
 * Événements de conversion (§2.5.4).
 *
 * Une seule fonction, appelée depuis les composants clients au moment où le
 * geste aboutit — jamais au clic sur le bouton : un envoi refusé par le
 * serveur ne doit pas compter comme une conversion, sinon les chiffres
 * surestiment ce que le site produit vraiment.
 *
 * Aucune donnée personnelle n'est transmise : ni adresse, ni nom, ni montant
 * rattachable à quelqu'un. Seuls la nature du geste et, pour un don, la
 * tranche de montant — c'est ce qu'il faut pour piloter, et rien de plus.
 */

/** Les gestes qui comptent, nommés une fois pour toutes. */
export type Conversion =
  | 'don_enregistre'
  | 'adhesion_demandee'
  | 'benevolat_propose'
  | 'partenariat_propose'
  | 'contact_envoye'
  | 'newsletter_inscrit'
  | 'compte_cree';

type Parametres = Record<string, string | number | boolean>;

interface FenetreMesuree extends Window {
  dataLayer?: unknown[];
}

export function mesurer(conversion: Conversion, parametres: Parametres = {}): void {
  if (typeof window === 'undefined') return;

  const fenetre = window as FenetreMesuree;
  // Absent tant qu'aucun identifiant n'est configuré : on ne crée pas la file
  // nous-mêmes, sinon les événements s'y empileraient sans jamais partir.
  if (!Array.isArray(fenetre.dataLayer)) return;

  fenetre.dataLayer.push({ event: conversion, ...parametres });
}

/**
 * Tranche d'un montant de don.
 *
 * Le montant exact rendrait un don identifiable par recoupement ; la tranche
 * suffit pour savoir si les petits dons progressent.
 */
export function tranche(montant: number): string {
  if (montant < 5_000) return 'moins_de_5k';
  if (montant < 25_000) return '5k_25k';
  if (montant < 100_000) return '25k_100k';
  return '100k_et_plus';
}
