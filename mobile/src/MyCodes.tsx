import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadCodes, type SavedCode } from './codes';
import { colors, fonts } from './theme';
import { Notice, Title } from './ui';

/** Les codes de retrait obtenus depuis ce téléphone, le plus récent d'abord. */
export function MyCodes() {
  const [codes, setCodes] = useState<SavedCode[] | null>(null);

  useEffect(() => {
    loadCodes().then(setCodes);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Title kicker="Retrait">Mes codes</Title>

      <Notice>
        Présentez le code de votre demande au point de distribution. L’association vous recontacte
        une fois la demande examinée.
      </Notice>

      {codes && !codes.length && (
        <Text style={styles.empty}>Aucune demande envoyée depuis ce téléphone.</Text>
      )}

      <View style={{ gap: 10 }}>
        {codes?.map((ligne) => (
          <View key={ligne.code} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.article}>{ligne.article}</Text>
              <Text style={styles.detail}>
                {ligne.quantity} {ligne.unit} ·{' '}
                {new Date(ligne.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <Text style={styles.code}>{ligne.code}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40 },
  empty: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paper,
    borderRadius: 18,
    padding: 16,
  },
  article: { fontFamily: fonts.semi, fontSize: 16, color: colors.ink },
  detail: { fontSize: 13, color: colors.muted, marginTop: 2 },
  code: { fontFamily: fonts.bold, fontSize: 24, letterSpacing: 3, color: colors.ink },
});
