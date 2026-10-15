import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { getCategories, sendRequest, type Category, type RequestKind } from './api';
import { saveCode } from './codes';
import { colors, fonts } from './theme';
import { Button, Field, Notice, Title } from './ui';

/** Article hors liste : seul un apport peut en viser un, comme sur le site. */
const AUTRE = 'autre';

type Choix = Category | typeof AUTRE;

/**
 * Demander une denrée, ou en proposer une : un article, puis le formulaire.
 *
 * Une demande porte sur un seul article — c'est la règle de l'API, que
 * l'application ne contourne pas. Pour plusieurs articles, on dépose
 * plusieurs demandes.
 */
export function RequestFlow({ kind }: { kind: RequestKind }) {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [echec, setEchec] = useState(false);
  const [choix, setChoix] = useState<Choix | null>(null);
  const [fini, setFini] = useState<{ code: string | null } | null>(null);

  const charger = useCallback(() => {
    setEchec(false);
    setCategories(null);
    getCategories()
      .then(setCategories)
      .catch(() => setEchec(true));
  }, []);

  useEffect(charger, [charger]);

  const recommencer = () => {
    setFini(null);
    setChoix(null);
    charger();
  };

  if (fini) return <Confirmation kind={kind} code={fini.code} onAgain={recommencer} />;

  if (choix) {
    return (
      <RequestForm
        kind={kind}
        choix={choix}
        onBack={() => setChoix(null)}
        onDone={(code) => setFini({ code })}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Title kicker={kind === 'RETRAIT' ? 'Faire une demande' : 'Proposer un don'}>
        {kind === 'RETRAIT' ? 'De quoi avez-vous besoin ?' : 'Que souhaitez-vous apporter ?'}
      </Title>

      {echec && (
        <>
          <Notice tone="error">
            Impossible de charger les articles. Vérifiez votre connexion.
          </Notice>
          <Button label="Réessayer" variant="ghost" onPress={charger} />
        </>
      )}

      {!categories && !echec && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.ink} size="large" />
          {/* Le serveur peut être en veille : le premier appel est lent. */}
          <Text style={styles.loadingText}>Chargement… cela peut prendre jusqu’à une minute.</Text>
        </View>
      )}

      {categories && (
        <ArticleList
          kind={kind}
          // On ne réclame que ce qui est en réserve.
          categories={kind === 'RETRAIT' ? categories.filter((c) => c.quantity > 0) : categories}
          onPick={setChoix}
        />
      )}
    </ScrollView>
  );
}

function ArticleList({
  kind,
  categories,
  onPick,
}: {
  kind: RequestKind;
  categories: Category[];
  onPick: (choix: Choix) => void;
}) {
  const retrait = kind === 'RETRAIT';

  if (retrait && !categories.length) {
    return <Notice>Aucun article n’est disponible pour le moment. Revenez un peu plus tard.</Notice>;
  }

  return (
    <View style={{ gap: 10 }}>
      {categories.map((categorie) => {
        const besoin = categorie.level !== 'OK';
        return (
          <Pressable
            key={categorie.id}
            onPress={() => onPick(categorie)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{categorie.name.slice(0, 3).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{categorie.name}</Text>
              <Text style={styles.cardSub}>
                {retrait
                  ? `${categorie.quantity} ${categorie.unit} disponibles`
                  : `En ${categorie.unit}`}
              </Text>
            </View>
            {/* Pour un donateur, le niveau dit quoi apporter en priorité. */}
            {!retrait && besoin && (
              <Text style={[styles.tag, categorie.level === 'CRITIQUE' && styles.tagUrgent]}>
                {categorie.level === 'CRITIQUE' ? 'Urgent' : 'Besoin'}
              </Text>
            )}
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        );
      })}

      {!retrait && (
        <Pressable
          onPress={() => onPick(AUTRE)}
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>+</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Autre article</Text>
            <Text style={styles.cardSub}>À préciser</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )}
    </View>
  );
}

function RequestForm({
  kind,
  choix,
  onBack,
  onDone,
}: {
  kind: RequestKind;
  choix: Choix;
  onBack: () => void;
  onDone: (code: string | null) => void;
}) {
  const retrait = kind === 'RETRAIT';
  const horsListe = choix === AUTRE;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otherLabel, setOtherLabel] = useState('');
  const [otherUnit, setOtherUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const defilement = useRef<ScrollView>(null);

  // Le message s'affiche en haut, le bouton est en bas : on remonte pour
  // qu'il soit lu.
  useEffect(() => {
    if (erreur) defilement.current?.scrollTo({ y: 0, animated: true });
  }, [erreur]);
  const [envoi, setEnvoi] = useState(false);

  // L'unité vient de l'article et ne se saisit pas, sauf hors liste.
  const unite = horsListe ? otherUnit.trim() || 'unités' : choix.unit;
  const article = horsListe ? otherLabel.trim() || 'Autre article' : choix.name;

  const envoyer = async () => {
    setErreur(null);
    // L'association recontacte par téléphone : sans numéro joignable, la
    // demande ne peut pas aboutir.
    if (phone.replace(/\D/g, '').length < 8) {
      setErreur('Indiquez votre numéro de téléphone.');
      return;
    }
    setEnvoi(true);
    const quantite = Number(quantity.replace(',', '.'));
    const resultat = await sendRequest({
      kind,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      isAnonymous,
      categoryId: horsListe ? undefined : choix.id,
      otherLabel: horsListe ? otherLabel.trim() || undefined : undefined,
      unit: horsListe ? otherUnit.trim() || undefined : undefined,
      quantity: quantite,
      message: message.trim() || undefined,
    });
    setEnvoi(false);

    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    if (resultat.pickupCode) {
      await saveCode({
        code: resultat.pickupCode,
        article,
        quantity: quantite,
        unit: unite,
        createdAt: new Date().toISOString(),
      });
    }
    onDone(resultat.pickupCode);
  };

  return (
    <ScrollView
      ref={defilement}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={onBack} hitSlop={12}>
        <Text style={styles.back}>‹ Articles</Text>
      </Pressable>

      <Title kicker={retrait ? 'Ma demande' : 'Mon don'}>{horsListe ? 'Autre article' : choix.name}</Title>

      {erreur && <Notice tone="error">{erreur}</Notice>}

      {horsListe && (
        <>
          <Field label="Quel article ?" value={otherLabel} onChangeText={setOtherLabel} />
          <Field
            label="Unité"
            placeholder="kg, L, pièces…"
            value={otherUnit}
            onChangeText={setOtherUnit}
          />
        </>
      )}

      <Field
        label={`Quantité (en ${unite})`}
        keyboardType="decimal-pad"
        value={quantity}
        onChangeText={setQuantity}
        hint={retrait && !horsListe ? `${choix.quantity} ${choix.unit} disponibles` : undefined}
      />
      <Field label="Prénom et nom" autoComplete="name" value={name} onChangeText={setName} />
      <Field
        label="Adresse e-mail"
        autoComplete="email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        label="Téléphone"
        autoComplete="tel"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <Field
        label={retrait ? 'Votre situation (facultatif)' : 'Précisions (facultatif)'}
        multiline
        style={[styles.multiline]}
        value={message}
        onChangeText={setMessage}
      />

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>
            {retrait ? 'Rendre ma demande anonyme' : 'Rendre mon don anonyme'}
          </Text>
          <Text style={styles.switchHint}>
            Votre nom n’apparaîtra sur aucun affichage public. L’association le conserve pour vous
            recontacter.
          </Text>
        </View>
        <Switch
          value={isAnonymous}
          onValueChange={setIsAnonymous}
          trackColor={{ true: colors.leaf, false: colors.line }}
          thumbColor={colors.paper}
        />
      </View>

      <Notice>
        {retrait
          ? 'Votre demande est examinée par l’association. Elle ne retire rien du stock tant que la remise n’a pas eu lieu.'
          : 'Votre apport n’est pas encore compté dans le stock : il le sera quand les denrées seront arrivées à l’entrepôt.'}
      </Notice>

      <Button
        label={retrait ? 'Envoyer ma demande' : 'Annoncer mon don'}
        onPress={envoyer}
        busy={envoi}
      />
    </ScrollView>
  );
}

function Confirmation({
  kind,
  code,
  onAgain,
}: {
  kind: RequestKind;
  code: string | null;
  onAgain: () => void;
}) {
  const retrait = kind === 'RETRAIT';
  return (
    <ScrollView contentContainerStyle={[styles.page, styles.done]}>
      <Text style={styles.doneKicker}>{retrait ? 'Demande envoyée' : 'Merci !'}</Text>
      <Text style={styles.doneTitle}>
        {retrait ? 'Votre demande est enregistrée' : 'Votre don est enregistré'}
      </Text>

      {code && (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Code de retrait à présenter</Text>
          <Text style={styles.code}>{code}</Text>
          <Text style={styles.codeHint}>
            Il vous sera demandé au moment de la remise. Vous le retrouverez dans « Mes codes ».
          </Text>
        </View>
      )}

      <Text style={styles.doneText}>
        {retrait
          ? 'L’association examine votre demande et vous recontacte. La sortie ne sera inscrite au registre qu’au moment de la remise.'
          : 'L’association vous recontacte pour convenir du dépôt.'}
      </Text>

      <Button label={retrait ? 'Faire une autre demande' : 'Proposer un autre don'} onPress={onAgain} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40 },
  loading: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.paper,
    borderRadius: 18,
    padding: 14,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.fog,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 13, color: colors.leaf },
  cardTitle: { fontFamily: fonts.semi, fontSize: 17, color: colors.ink },
  cardSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  tag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
    backgroundColor: '#fdf1d6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  tagUrgent: { backgroundColor: '#fdecea', color: colors.danger },
  chevron: { fontSize: 26, color: colors.muted },
  back: { color: colors.muted, fontSize: 15, marginBottom: 10 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: colors.ink },
  switchHint: { fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 2 },
  done: { flexGrow: 1, backgroundColor: colors.ink },
  doneKicker: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  doneTitle: { fontFamily: fonts.bold, fontSize: 28, color: colors.paper, marginTop: 6 },
  codeCard: {
    backgroundColor: colors.paper,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginTop: 22,
  },
  codeLabel: { fontSize: 13, color: colors.muted },
  code: {
    fontFamily: fonts.bold,
    fontSize: 48,
    letterSpacing: 8,
    color: colors.ink,
    marginVertical: 6,
  },
  codeHint: { fontSize: 13, lineHeight: 19, color: colors.muted, textAlign: 'center' },
  doneText: { color: colors.fog, fontSize: 14, lineHeight: 21, marginVertical: 22 },
});
