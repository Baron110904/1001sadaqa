import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { FedapayService } from '../dist/modules/donations/fedapay.service.js';

/**
 * Vérification de la signature des webhooks FedaPay.
 *
 * Ce chemin ne peut pas être éprouvé en appelant FedaPay : leurs
 * notifications ne partent que vers une adresse publique. On forge donc les
 * en-têtes ici. C'est le seul endroit du code où une erreur laisserait un
 * inconnu marquer des dons comme encaissés — il mérite ses propres épreuves.
 *
 * Le test porte sur le code compilé (`dist/`) : le projet n'a pas de
 * transpilation à la volée, et en ajouter une pour un fichier serait payer
 * cher une commodité. Lancer avec `npm test`, qui construit d'abord.
 */

const SECRET = 'wh_secret_de_test';
const CORPS = JSON.stringify({ name: 'transaction.approved', entity: { id: 510846 } });

const service = new FedapayService();

const entete = (corps = CORPS, secret = SECRET, decalage = 0) => {
  const t = Math.floor(Date.now() / 1000) + decalage;
  const s = createHmac('sha256', secret).update(`${t}.${corps}`, 'utf8').digest('hex');
  return `t=${t},s=${s}`;
};

test('accepte une signature correcte', () => {
  assert.equal(service.verifierSignature(CORPS, entete(), SECRET), true);
});

test('refuse une signature calculée avec un autre secret', () => {
  assert.equal(service.verifierSignature(CORPS, entete(CORPS, 'wh_mauvais'), SECRET), false);
});

test('refuse un corps modifié après signature', () => {
  const signe = entete();
  const falsifie = JSON.stringify({ name: 'transaction.approved', entity: { id: 999999 } });
  assert.equal(service.verifierSignature(falsifie, signe, SECRET), false);
});

test('refuse un message rejoué hors de la fenêtre de cinq minutes', () => {
  assert.equal(service.verifierSignature(CORPS, entete(CORPS, SECRET, -400), SECRET), false);
});

test('accepte un léger décalage d’horloge, dans la fenêtre', () => {
  assert.equal(service.verifierSignature(CORPS, entete(CORPS, SECRET, -120), SECRET), true);
});

test('refuse un en-tête absent, vide ou mal formé', () => {
  assert.equal(service.verifierSignature(CORPS, undefined, SECRET), false);
  assert.equal(service.verifierSignature(CORPS, '', SECRET), false);
  assert.equal(service.verifierSignature(CORPS, 'n’importe quoi', SECRET), false);
  assert.equal(service.verifierSignature(CORPS, 't=123', SECRET), false);
});

test('refuse tout tant qu’aucun secret n’est enregistré', () => {
  // Le cas du jour où l'association branche FedaPay sans coller le secret :
  // mieux vaut ne traiter aucune notification qu'en traiter une forgée.
  assert.equal(service.verifierSignature(CORPS, entete(), ''), false);
});
