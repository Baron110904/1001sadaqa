import Link from 'next/link';
import { adminFetch, currentUser } from '@/lib/admin/client';
import { AdminHeader, Badge, EmptyState, Panel } from '@/components/admin/ui';
import { StatusSelect } from '@/components/admin/StatusSelect';
import { MotActions } from '@/components/admin/MotActions';
import { formatDate, formatXof } from '@/lib/format';

interface Paginated<T> {
  items: T[];
  total: number;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  availability: string | null;
  status: string;
  createdAt: string;
  mission: { title: string } | null;
}

interface PartnershipRequest {
  id: string;
  organisation: string;
  contactName: string;
  email: string;
  phone: string | null;
  intent: string;
  status: string;
  createdAt: string;
}

interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string | null;
  donorCountry: string | null;
  donorCity: string | null;
  amount: number;
  method: string;
  frequency: string;
  status: string;
  createdAt: string;
  program: { title: string } | null;
}

const CONTACT_STATUSES = [
  { value: 'PENDING', label: 'À traiter' },
  { value: 'READ', label: 'Lu' },
  { value: 'REPLIED', label: 'Répondu' },
  { value: 'ARCHIVED', label: 'Archivé' },
];

const VOLUNTEER_STATUSES = [
  { value: 'PENDING', label: 'À contacter' },
  { value: 'CONTACTED', label: 'Contacté' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
];

const DONATION_STATUSES = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'COMPLETED', label: 'Encaissé' },
  { value: 'FAILED', label: 'Échoué' },
];

function statusTone(status: string): 'ok' | 'wait' | 'off' | 'neutral' {
  if (status === 'PENDING') return 'wait';
  if (status === 'REPLIED' || status === 'ACTIVE' || status === 'COMPLETED') return 'ok';
  if (status === 'APPROVED') return 'ok';
  if (status === 'ARCHIVED' || status === 'INACTIVE' || status === 'FAILED' || status === 'REJECTED')
    return 'off';
  return 'neutral';
}

/**
 * Statuts d'une demande déposée sur la banque alimentaire.
 *
 * « Validée » n'est pas une mention : c'est le geste qui écrit le mouvement
 * dans le registre et déplace le stock. D'où le rappel affiché au-dessus du
 * tableau.
 */
const BANQUE_STATUSES = [
  { value: 'PENDING', label: 'À traiter' },
  { value: 'APPROVED', label: 'Validée - écrit au registre' },
  { value: 'REJECTED', label: 'Refusée' },
];

const TABS = [
  { key: 'messages', label: 'Messages' },
  { key: 'benevoles', label: 'Bénévoles' },
  { key: 'partenariats', label: 'Partenariats' },
  { key: 'adhesions', label: 'Adhésions' },
  { key: 'dons', label: 'Dons' },
  { key: 'banque-apports', label: 'Banque · apports' },
  { key: 'banque-retraits', label: 'Banque · retraits' },
  { key: 'banque-mots', label: 'Banque · mots reçus' },
] as const;

interface DemandeBanque {
  id: string;
  kind: 'DON' | 'RETRAIT';
  status: string;
  name: string;
  email: string;
  phone: string | null;
  isAnonymous: boolean;
  otherLabel: string | null;
  quantity: number;
  unit: string;
  message: string | null;
  movementId: string | null;
  createdAt: string;
  category: { id: string; name: string; unit: string } | null;
}

interface MotBanque {
  id: string;
  authorName: string;
  isAnonymous: boolean;
  message: string;
  isPublished: boolean;
  createdAt: string;
}

/**
 * Demandes entrantes.
 *
 * Un onglet par nature de demande, l'onglet actif vivant dans l'URL — un lien
 * vers « les candidatures bénévoles » reste donc partageable. Le changement de
 * statut est un formulaire qui s'envoie à la sélection : c'est le seul geste
 * quotidien sur cet écran, il ne mérite pas un bouton de plus.
 */
export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string; erreur?: string }>;
}) {
  const { onglet, erreur } = await searchParams;
  const user = await currentUser();
  if (!user) return null;

  const active = TABS.find((tab) => tab.key === onglet)?.key ?? 'messages';
  const isAdmin = user.role === 'ADMIN';
  const retour = `/admin/demandes?onglet=${active}`;

  return (
    <>
      <AdminHeader title="Demandes reçues" />

      {/* Refus de l'API : une sortie qui dépasse le stock, un apport hors
          liste sans article rattaché. L'opérateur est seul à pouvoir lever
          ces cas, encore faut-il qu'il les voie. */}
      {erreur && (
        <div
          role="alert"
          className="mb-6 rounded-card border border-red-600/30 bg-red-50 px-5 py-4 text-[0.9375rem] text-red-900"
        >
          {erreur}
        </div>
      )}

      {/* Ancres ordinaires, pas de `Link`.
          Ces onglets ne changent que le paramètre d'URL d'une même route. Le
          routeur client de Next avalait le premier clic suivant un chargement
          de page : le lien portait la bonne adresse, rien ne se passait, et
          l'onglet paraissait mort. Une ancre navigue toujours, même avant que
          React ne soit attaché — et chaque onglet lit de toute façon d'autres
          données, il n'y a pas de transition à économiser. */}
      <nav aria-label="Type de demande" className="mb-6 flex flex-wrap gap-2">
        {TABS.filter((tab) => !['dons', 'adhesions'].includes(tab.key) || isAdmin).map((tab) => (
          <a
            key={tab.key}
            href={`/admin/demandes?onglet=${tab.key}`}
            aria-current={active === tab.key ? 'page' : undefined}
            className={`rounded-full border px-4 py-2 font-display text-[0.875rem] font-semibold transition-colors ${
              active === tab.key
                ? 'border-ink bg-ink text-paper'
                : 'border-ink/15 text-ink hover:border-ink/40 hover:bg-paper'
            }`}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      {active === 'messages' && <Messages />}
      {active === 'benevoles' && <Volunteers />}
      {active === 'partenariats' && <Partnerships />}
      {active === 'adhesions' && isAdmin && <Memberships />}
      {active === 'dons' && isAdmin && <Donations />}
      {active === 'banque-apports' && <DemandesBanque kind="DON" retour={retour} />}
      {active === 'banque-retraits' && <DemandesBanque kind="RETRAIT" retour={retour} />}
      {active === 'banque-mots' && <MotsBanque />}
    </>
  );
}

/**
 * Apports et retraits déposés depuis la banque alimentaire.
 *
 * Valider écrit au registre et déplace le stock : c'est pour cela que le
 * rappel est au-dessus du tableau et non enfoui dans une aide. Le registre
 * doit refléter ce qui est dans l'entrepôt, pas ce qui a été promis.
 */
async function DemandesBanque({ kind, retour }: { kind: 'DON' | 'RETRAIT'; retour: string }) {
  const lignes = await adminFetch<DemandeBanque[]>(`/foodbank/admin/requests?kind=${kind}`);
  const apport = kind === 'DON';

  if (!lignes.length) {
    return (
      <EmptyState
        title={apport ? 'Aucun apport annoncé' : 'Aucune demande de retrait'}
        body={`Les ${apport ? 'propositions de don' : 'demandes'} déposées sur la banque alimentaire arrivent ici.`}
      />
    );
  }

  return (
    <>
      <div className="mb-5 rounded-card border border-gold/40 bg-gold/10 px-5 py-4 text-[0.9375rem] leading-relaxed text-ink">
        <strong className="font-display font-bold">Avant de valider :</strong> le mouvement doit
        avoir eu lieu physiquement. Valider écrit l’entrée ou la sortie au registre et modifie le
        stock affiché sur le site — ne validez qu’une fois les denrées{' '}
        {apport ? 'reçues à l’entrepôt' : 'remises à la personne'}.
      </div>

      <Panel className="overflow-hidden p-0 md:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-[0.875rem]">
            <thead>
              <tr className="border-b border-ink/10 bg-mist">
                {['Personne', 'Article', 'Quantité', 'Reçu le', 'Statut'].map((titre) => (
                  <th
                    key={titre}
                    scope="col"
                    className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink"
                  >
                    {titre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-ink/8 last:border-0">
                  <td className="px-4 py-3">
                    <span className="block text-ink">{ligne.name}</span>
                    <a href={`mailto:${ligne.email}`} className="link-sweep text-muted">
                      {ligne.email}
                    </a>
                    {ligne.phone && <span className="block text-[0.75rem] text-muted">{ligne.phone}</span>}
                    {ligne.isAnonymous && (
                      <span className="mt-1 block text-[0.75rem] text-gold-deep">
                        Anonyme publiquement
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {ligne.category?.name ?? (
                      <span className="text-gold-deep">
                        {ligne.otherLabel ?? '—'} <span className="text-muted">(hors liste)</span>
                      </span>
                    )}
                    {ligne.message && (
                      <span className="mt-1 block text-[0.75rem] text-muted">{ligne.message}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink tabular whitespace-nowrap">
                    {ligne.quantity} {ligne.unit}
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {formatDate(ligne.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone(ligne.status)}>
                        {BANQUE_STATUSES.find((s) => s.value === ligne.status)?.label ?? ligne.status}
                      </Badge>
                      {/* Une demande déjà comptée ne se rejoue pas : la
                          correction passe par le mouvement, au registre. */}
                      {ligne.movementId ? (
                        <span className="text-[0.75rem] text-muted">Comptée au registre</span>
                      ) : (
                        <StatusSelect
                          path={`/foodbank/requests/${ligne.id}`}
                          tag="foodbank"
                          current={ligne.status}
                          options={BANQUE_STATUSES}
                          retour={retour}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/**
 * Mots laissés par les personnes accompagnées.
 *
 * Rien ne paraît sans lecture : un mot déposé attend d'être publié. Le
 * retirer reste possible ensuite, mais on ne compte pas là-dessus — le temps
 * de supprimer un propos déplacé, il a déjà été vu.
 */
async function MotsBanque() {
  const mots = await adminFetch<MotBanque[]>('/foodbank/admin/comments');

  if (!mots.length) {
    return (
      <EmptyState
        title="Aucun mot reçu"
        body="Les mots laissés depuis la page de la banque alimentaire arrivent ici, en attente de publication."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {mots.map((mot) => (
        <li key={mot.id}>
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-display text-[0.9375rem] font-bold text-ink">
                  {mot.authorName}
                  {mot.isAnonymous && (
                    <span className="ml-2 font-sans text-[0.75rem] font-normal text-gold-deep">
                      paraîtra sans son nom
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[0.75rem] text-muted">{formatDate(mot.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone={mot.isPublished ? 'ok' : 'wait'}>
                  {mot.isPublished ? 'Publié' : 'En attente'}
                </Badge>
                <MotActions id={mot.id} isPublished={mot.isPublished} />
              </div>
            </div>

            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{mot.message}</p>
          </Panel>
        </li>
      ))}
    </ul>
  );
}

async function Messages() {
  const page = await adminFetch<Paginated<Contact>>('/contacts?limit=60');

  if (!page.items.length) {
    return <EmptyState title="Aucun message" body="Les messages du formulaire de contact arrivent ici." />;
  }

  return (
    <div className="space-y-3">
      {page.items.map((contact) => (
        <Panel key={contact.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                {contact.subject}
              </p>
              <p className="mt-1 text-[0.875rem] text-muted">
                {contact.name} ·{' '}
                <a href={`mailto:${contact.email}`} className="link-sweep">
                  {contact.email}
                </a>
                {contact.phone && (
                  <>
                    {' · '}
                    <a href={`tel:${contact.phone}`} className="link-sweep">
                      {contact.phone}
                    </a>
                  </>
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Badge tone={statusTone(contact.status)}>
                {CONTACT_STATUSES.find((s) => s.value === contact.status)?.label ?? contact.status}
              </Badge>
              <StatusSelect
                path={`/contacts/${contact.id}`}
                tag="settings"
                current={contact.status}
                options={CONTACT_STATUSES}
              />
            </div>
          </div>

          <p className="mt-4 border-t border-ink/10 pt-4 text-[0.9375rem] leading-relaxed whitespace-pre-line text-ink/85">
            {contact.message}
          </p>

          <p className="mt-3 text-[0.75rem] text-muted">Reçu le {formatDate(contact.createdAt)}</p>
        </Panel>
      ))}
    </div>
  );
}

async function Volunteers() {
  const page = await adminFetch<Paginated<Volunteer>>('/volunteers?limit=60');

  if (!page.items.length) {
    return <EmptyState title="Aucune candidature" body="Les candidatures bénévoles arrivent ici." />;
  }

  return (
    <div className="space-y-3">
      {page.items.map((volunteer) => (
        <Panel key={volunteer.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                {volunteer.name}
              </p>
              <p className="mt-1 text-[0.875rem] text-muted">
                <a href={`mailto:${volunteer.email}`} className="link-sweep">
                  {volunteer.email}
                </a>
                {' · '}
                <a href={`tel:${volunteer.phone}`} className="link-sweep">
                  {volunteer.phone}
                </a>
              </p>
              {volunteer.mission && (
                <p className="mt-2 text-[0.875rem] text-ink">
                  Mission souhaitée : <strong>{volunteer.mission.title}</strong>
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Badge tone={statusTone(volunteer.status)}>
                {VOLUNTEER_STATUSES.find((s) => s.value === volunteer.status)?.label ??
                  volunteer.status}
              </Badge>
              <StatusSelect
                path={`/volunteers/${volunteer.id}`}
                tag="missions"
                current={volunteer.status}
                options={VOLUNTEER_STATUSES}
              />
            </div>
          </div>

          {volunteer.availability && (
            <p className="mt-4 border-t border-ink/10 pt-4 text-[0.9375rem] leading-relaxed whitespace-pre-line text-ink/85">
              {volunteer.availability}
            </p>
          )}

          <p className="mt-3 text-[0.75rem] text-muted">
            Reçue le {formatDate(volunteer.createdAt)}
          </p>
        </Panel>
      ))}
    </div>
  );
}

async function Partnerships() {
  const requests = await adminFetch<PartnershipRequest[]>('/partners/admin/requests');

  if (!requests.length) {
    return (
      <EmptyState
        title="Aucune demande"
        body="Les demandes de l’espace partenaires arrivent ici."
      />
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Panel key={request.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                {request.organisation}
              </p>
              <p className="mt-1 text-[0.875rem] text-muted">
                {request.contactName} ·{' '}
                <a href={`mailto:${request.email}`} className="link-sweep">
                  {request.email}
                </a>
                {request.phone && ` · ${request.phone}`}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Badge tone={statusTone(request.status)}>
                {CONTACT_STATUSES.find((s) => s.value === request.status)?.label ?? request.status}
              </Badge>
              <StatusSelect
                path={`/partenaires/admin/requests/${request.id}`}
                tag="partners"
                current={request.status}
                options={CONTACT_STATUSES}
              />
            </div>
          </div>

          <p className="mt-4 border-t border-ink/10 pt-4 text-[0.9375rem] leading-relaxed whitespace-pre-line text-ink/85">
            {request.intent}
          </p>

          <p className="mt-3 text-[0.75rem] text-muted">Reçue le {formatDate(request.createdAt)}</p>
        </Panel>
      ))}
    </div>
  );
}

async function Donations() {
  const page = await adminFetch<Paginated<Donation>>('/donations?limit=60');

  if (!page.items.length) {
    return <EmptyState title="Aucun don enregistré" body="Les dons du formulaire arrivent ici." />;
  }

  return (
    <>
      <Panel className="overflow-hidden p-0 md:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-[0.875rem]">
            <thead>
              <tr className="border-b border-ink/10 bg-mist">
                {['Donateur', 'Montant', 'Affectation', 'Moyen', 'Reçu le', 'Statut'].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-3 font-display text-[0.8125rem] font-bold text-ink"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {page.items.map((donation) => (
                <tr key={donation.id} className="border-b border-ink/8 last:border-0">
                  <td className="px-4 py-3">
                    <span className="block text-ink">{donation.donorName}</span>
                    <a href={`mailto:${donation.donorEmail}`} className="link-sweep text-muted">
                      {donation.donorEmail}
                    </a>
                    {/* Provenance sous l'identité plutôt qu'en colonne : le
                        tableau en compte déjà six, et une septième le ferait
                        défiler horizontalement sur un portable. */}
                    {donation.donorCountry && (
                      <span className="mt-0.5 block text-[0.75rem] text-muted">
                        {[donation.donorCity, donation.donorCountry].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink tabular whitespace-nowrap">
                    {formatXof(donation.amount)}
                    {donation.frequency === 'MONTHLY' && (
                      <span className="block text-[0.75rem] font-normal text-muted">par mois</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {donation.program?.title ?? 'Là où le besoin est le plus urgent'}
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {donation.method === 'MOBILE_MONEY'
                      ? 'Mobile Money'
                      : donation.method === 'BANK_TRANSFER'
                        ? 'Virement'
                        : 'Carte'}
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {formatDate(donation.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Badge tone={statusTone(donation.status)}>
                        {DONATION_STATUSES.find((s) => s.value === donation.status)?.label ??
                          donation.status}
                      </Badge>
                      <StatusSelect
                        path={`/donations/${donation.id}`}
                        tag="stats"
                        current={donation.status}
                        options={DONATION_STATUSES}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/** États d'une adhésion, dans l'ordre où l'administration les emploie. */
const MEMBER_STATUSES = [
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'ACTIF', label: 'Membre actif' },
  { value: 'SUSPENDU', label: 'Suspendu' },
  { value: 'RADIE', label: 'Radié' },
] as const;

interface MemberRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  profession: string | null;
  interests: string[];
  motivation: string | null;
  pledgedAmount: number;
  status: string;
  joinedAt: string | null;
  createdAt: string;
  _count?: { contributions: number };
}

/**
 * Demandes d'adhésion.
 *
 * L'adhésion engage l'association — l'API réserve la décision à
 * l'administration, et cet écran le reflète. Sans lui, les demandes
 * s'accumulaient en base sans qu'aucun écran ne permette de les valider : le
 * formulaire public fonctionnait, mais il ne menait nulle part.
 */
async function Memberships() {
  const membres = await adminFetch<MemberRow[]>('/members');

  if (!membres.length) {
    return (
      <EmptyState
        title="Aucune demande d’adhésion"
        body="Les demandes déposées depuis le site apparaissent ici."
      />
    );
  }

  return (
    <div className="space-y-3">
      {membres.map((membre) => (
        <Panel key={membre.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-[1.0625rem] font-bold tracking-tight text-ink">
                {membre.name}
              </p>
              <p className="mt-1 text-[0.875rem] text-muted">
                <a href={`mailto:${membre.email}`} className="link-sweep">
                  {membre.email}
                </a>
                {' · '}
                <a href={`tel:${membre.phone}`} className="link-sweep">
                  {membre.phone}
                </a>
                {membre.city ? ` · ${membre.city}` : ''}
              </p>
              <p className="mt-2 text-[0.875rem] text-ink">
                Cotisation déclarée : <strong>{formatXof(membre.pledgedAmount)}</strong> par mois
                {membre._count?.contributions
                  ? ` · ${membre._count.contributions} versement${membre._count.contributions > 1 ? 's' : ''} enregistré${membre._count.contributions > 1 ? 's' : ''}`
                  : ' · aucun versement enregistré'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Badge tone={membre.status === 'ACTIF' ? 'ok' : membre.status === 'EN_ATTENTE' ? 'wait' : 'off'}>
                {MEMBER_STATUSES.find((s) => s.value === membre.status)?.label ?? membre.status}
              </Badge>
              {/* La route de décision accepte le seul statut : le motif est
                  facultatif, et se saisit depuis la fiche du membre. */}
              <StatusSelect
                path={`/members/${membre.id}/decision`}
                tag="stats"
                current={membre.status}
                options={[...MEMBER_STATUSES]}
              />
            </div>
          </div>

          {membre.motivation && (
            <p className="mt-4 border-t border-ink/10 pt-4 text-[0.9375rem] leading-relaxed whitespace-pre-line text-ink/85">
              {membre.motivation}
            </p>
          )}

          <p className="mt-3 text-[0.75rem] text-muted">
            Demande reçue le {formatDate(membre.createdAt)}
            {membre.joinedAt ? ` · membre depuis le ${formatDate(membre.joinedAt)}` : ''}
          </p>
        </Panel>
      ))}
    </div>
  );
}
