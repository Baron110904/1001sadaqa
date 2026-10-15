# Application mobile — Banque alimentaire

Application Android (Expo) de la banque alimentaire 1001 SADAQA. Elle sert à deux choses :

- **Demander** une denrée : la demande reçoit un **code de retrait à 6 chiffres**, à présenter au guichet ;
- **Proposer un don** en nature.

Elle n'utilise que les routes publiques de l'API (`GET /foodbank`, `POST /foodbank/requests`).
Les demandes arrivent au back-office, onglets *Banque · retraits* et *Banque · apports*,
exactement comme celles déposées sur le site. Les codes obtenus sont gardés sur le téléphone
(onglet *Mes codes*).

## Lancer en développement

```bash
cd mobile
npm install
npx expo start --android
```

Par défaut, l'application appelle `http://10.0.2.2:4100/api/v1`, c'est-à-dire l'API lancée sur
le poste, vue depuis l'émulateur Android. Sur un vrai téléphone, indiquez l'adresse du poste
dans `mobile/.env.local` :

```
EXPO_PUBLIC_API_URL=http://192.168.1.20:4100/api/v1
```

## Produire l'APK

Les builds passent par EAS (compte Expo gratuit) :

```bash
npx eas-cli login
npx eas-cli build --platform android --profile apk         # APK à installer directement
npx eas-cli build --platform android --profile production  # .aab pour le Play Store
```

L'adresse de l'API de production est fixée dans `eas.json`.

## Vérifier

```bash
npx tsc --noEmit
```
