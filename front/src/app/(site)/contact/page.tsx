import type { Metadata } from 'next';
import { text } from '@/lib/text';
// TikTok n'a pas d'icône dédiée dans lucide : `Music2` est le symbole retenu
// par la bibliothèque pour les plateformes musicales.
import { ArrowRight, ExternalLink, Facebook, Linkedin, MapPin, Music2 } from 'lucide-react';
import { getSettings } from '@/lib/api';
import { PageHero } from '@/components/blocks/PageHero';
import { ContactForm } from '@/components/forms/ContactForm';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/Reveal';
import { whatsappLink } from '@/lib/format';
import { headingLines } from '@/lib/heading';

/**
 * Position du siège, quartier de Fidjrossè à Cotonou.
 *
 * Coordonnées relevées sur Nominatim (OpenStreetMap) pour « Fidjrossè, 12ᵉ
 * arrondissement, Cotonou » — la première valeur utilisée était approximative
 * d'environ un kilomètre et demi. Le numéro de lot n'étant pas cartographié,
 * le repère pointe le quartier ; c'est le niveau de précision honnête ici.
 */
const MAP_LAT = 6.3525;
const MAP_LON = 2.3675;

export function generateMetadata(): Metadata {
  const t = text('contact');
  return { title: t('eyebrow') };
}

export default async function ContactPage() {
  const t = text('contact');
  const tCommon = text('common');
  const settings = await getSettings();

  const phone = settings['contact.phone'] ?? '';
  const email = settings['contact.email'] ?? '';
  const address = settings['contact.address'] ?? '';
  const whatsapp = settings['contact.whatsapp'] ?? '';

  const reseaux = [
    { cle: 'facebook', nom: 'Facebook', href: settings['social.facebook'], Icon: Facebook },
    { cle: 'tiktok', nom: 'TikTok', href: settings['social.tiktok'], Icon: Music2 },
    { cle: 'linkedin', nom: 'LinkedIn', href: settings['social.linkedin'], Icon: Linkedin },
  ].filter((reseau) => Boolean(reseau.href)) as {
    cle: string;
    nom: string;
    href: string;
    Icon: typeof Facebook;
  }[];

  const delta = 0.012;
  const bbox = `${MAP_LON - delta}%2C${MAP_LAT - delta}%2C${MAP_LON + delta}%2C${MAP_LAT + delta}`;

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} lines={headingLines(t('title'))} />

      <section className="container-page py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <ContactForm />
          </Reveal>

          <RevealGroup className="space-y-4" stagger={0.1}>
            {address && (
              <RevealItem>
                <div className="rounded-card bg-mist p-6">
                  <p className="eyebrow text-leaf">{t('addressLabel')}</p>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink">{address}</p>
                </div>
              </RevealItem>
            )}

            <RevealItem>
              <div className="rounded-card bg-mist p-6">
                <p className="eyebrow text-leaf">{t('reachLabel')}</p>
                <p className="mt-3 space-y-1 text-[1.0625rem] text-ink">
                  {phone && (
                    <a
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="link-sweep block w-fit"
                    >
                      {phone}
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="link-sweep block w-fit">
                      {email}
                    </a>
                  )}
                </p>
              </div>
            </RevealItem>

            {whatsapp && (
              <RevealItem>
                <a
                  href={whatsappLink(whatsapp, tCommon('whatsappMessage'))}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-center justify-between gap-4 rounded-card bg-whatsapp p-6 transition-transform duration-300 hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  <span>
                    <span className="eyebrow block text-ink/70">{t('whatsappLabel')}</span>
                    <span className="mt-2 block font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                      {t('whatsappCta')}
                    </span>
                  </span>
                  <ArrowRight
                    className="size-5 shrink-0 text-ink transition-transform duration-300 group-hover:translate-x-1"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                </a>
              </RevealItem>
            )}

            <RevealItem>
              <div className="overflow-hidden rounded-card border border-ink/10 bg-sand">
                {/* Carte OpenStreetMap : aucune clé d'API, aucun traceur tiers.
                    Le chargement est différé pour ne pas peser sur la page. */}
                <iframe
                  title={t('mapTitle')}
                  loading="lazy"
                  className="h-72 w-full border-0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${MAP_LAT}%2C${MAP_LON}`}
                />

                {/* L'adresse complète est répétée sous la carte : le repère
                    situe le quartier, ce libellé donne le lot exact - que la
                    cartographie ne contient pas. */}
                <div className="flex flex-wrap items-start justify-between gap-3 bg-paper px-5 py-4">
                  <p className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-ink">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                    <span>
                      <span className="block font-semibold">{t('mapLabel')}</span>
                      <span className="block text-muted">{address}</span>
                    </span>
                  </p>

                  <a
                    href={`https://www.openstreetmap.org/?mlat=${MAP_LAT}&mlon=${MAP_LON}#map=16/${MAP_LAT}/${MAP_LON}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-sweep link-tap inline-flex shrink-0 items-center gap-1.5 text-[0.8125rem] font-medium text-leaf"
                  >
                    {t('openInMaps')}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </div>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* ── Réseaux sociaux ──────────────────────────────────────────── */}
      {/* Chaque bouton n'apparaît que si son adresse est renseignée dans les
          Paramètres du back-office : mieux vaut pas de bouton qu'un bouton qui
          ne mène nulle part. */}
      {reseaux.length > 0 && (
        <section className="bg-mist py-14 md:py-20">
          <div className="container-page">
            <Reveal from="none">
              <h2 className="font-display text-heading font-bold tracking-tight text-ink">
                {t('socialTitle')}
              </h2>
              <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">
                {t('socialLead')}
              </p>
            </Reveal>

            <RevealGroup className="mt-8 flex flex-wrap gap-3" stagger={0.09} as="ul">
              {reseaux.map(({ cle, nom, href, Icon }) => (
                <RevealItem key={cle} as="li">
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2.5 rounded-full border border-ink/15 bg-paper px-5 py-3 font-display text-[0.875rem] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-mist"
                  >
                    <Icon className="size-4" aria-hidden />
                    {nom}
                    <ExternalLink className="size-3.5 text-muted" aria-hidden />
                    <span className="sr-only"> - {t('openInNewTab')}</span>
                  </a>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}
    </>
  );
}
