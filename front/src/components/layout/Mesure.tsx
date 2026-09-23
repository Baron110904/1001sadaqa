import Script from 'next/script';

/**
 * Mesure d'audience (§2.5.4).
 *
 * Rien n'est chargé tant qu'aucun identifiant n'est renseigné dans les
 * paramètres : un site sans mesure ne doit pas appeler un traceur pour rien,
 * et cela laisse le choix à l'association plutôt qu'au code.
 *
 * Deux réglages écartent d'emblée les usages les plus intrusifs :
 * l'anonymisation des adresses IP, et la coupure des signaux publicitaires —
 * une association humanitaire n'a aucune raison d'alimenter un ciblage
 * publicitaire avec les visites de ses bénéficiaires.
 */
export function Mesure({ ga4Id }: { ga4Id?: string }) {
  if (!ga4Id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
        strategy="afterInteractive"
      />
      <Script id="mesure-audience" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', '${ga4Id}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
          });
        `}
      </Script>
    </>
  );
}
