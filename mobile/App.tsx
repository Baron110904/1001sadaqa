import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image, KeyboardAvoidingView, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Import par graisse : l'index du paquet embarquerait les neuf fichiers.
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold';
import { RequestFlow } from './src/RequestFlow';
import { MyCodes } from './src/MyCodes';
import { colors, fonts } from './src/theme';

const ONGLETS = [
  { key: 'demander', label: 'Demander' },
  { key: 'donner', label: 'Donner' },
  { key: 'codes', label: 'Mes codes' },
] as const;

type Onglet = (typeof ONGLETS)[number]['key'];

/**
 * Trois onglets, sans bibliothèque de navigation : l'application doit rester
 * légère, et il n'y a pas de pile d'écrans à gérer.
 */
export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Outfit_600SemiBold, Outfit_700Bold });
  const [onglet, setOnglet] = useState<Onglet>('demander');

  // Sans la police, on affiche quand même : mieux vaut la police du système
  // qu'un écran vide.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <View style={styles.header}>
          <Image source={require('./assets/logo-light.png')} style={styles.logo} />
          <View>
            <Text style={styles.brand}>1001 SADAQA</Text>
            <Text style={styles.brandSub}>Banque alimentaire</Text>
          </View>
        </View>

        <KeyboardAvoidingView style={styles.body}>
          {onglet === 'demander' && <RequestFlow key="RETRAIT" kind="RETRAIT" />}
          {onglet === 'donner' && <RequestFlow key="DON" kind="DON" />}
          {onglet === 'codes' && <MyCodes />}
        </KeyboardAvoidingView>

        <View style={styles.tabs}>
          {ONGLETS.map((tab) => {
            const actif = tab.key === onglet;
            return (
              <Pressable key={tab.key} onPress={() => setOnglet(tab.key)} style={styles.tab}>
                <View style={[styles.tabMark, actif && { backgroundColor: colors.gold }]} />
                <Text style={[styles.tabLabel, actif && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  logo: { width: 44, height: 44 },
  brand: { fontFamily: fonts.bold, fontSize: 18, color: colors.paper },
  brandSub: { fontSize: 13, color: colors.gold },
  body: { flex: 1, backgroundColor: colors.mist },
  tabs: { flexDirection: 'row', backgroundColor: colors.paper },
  tab: { flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 12 },
  tabMark: { width: 28, height: 3, borderRadius: 2, marginBottom: 8 },
  tabLabel: { fontSize: 13, color: colors.muted },
  tabLabelActive: { fontFamily: fonts.bold, color: colors.ink },
});
