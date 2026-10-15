import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Codes de retrait obtenus depuis ce téléphone.
 *
 * Ils ne vivent que sur l'appareil : l'API ne sert pas les demandes à ceux
 * qui les ont déposées. Garder le code ici évite à la personne de le perdre
 * entre le dépôt et la remise.
 */
const CLE = 'sadaqa.codes-retrait';

export interface SavedCode {
  code: string;
  article: string;
  quantity: number;
  unit: string;
  createdAt: string;
}

export async function loadCodes(): Promise<SavedCode[]> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as SavedCode[]) : [];
  } catch {
    return [];
  }
}

export async function saveCode(code: SavedCode): Promise<void> {
  const codes = await loadCodes();
  await AsyncStorage.setItem(CLE, JSON.stringify([code, ...codes]));
}
