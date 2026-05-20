import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Resident } from '@/types';

const STORAGE_KEY = '@gerencia:residents';

const SEED: Resident[] = [
  { id: 'r1', name: 'Morador 1', weight: 1.0, active: true },
  { id: 'r2', name: 'Morador 2', weight: 1.0, active: true },
  { id: 'r3', name: 'Morador 3', weight: 1.0, active: true },
];

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function getResidents(): Promise<Resident[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    return SEED;
  }
  return JSON.parse(raw) as Resident[];
}

export async function saveResidents(residents: Resident[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(residents));
}

export async function addResident(name: string, weight = 1.0): Promise<Resident> {
  const list = await getResidents();
  const r: Resident = { id: uid(), name: name.trim(), weight, active: true };
  await saveResidents([...list, r]);
  return r;
}

export async function updateResident(
  id: string,
  patch: Partial<Omit<Resident, 'id'>>,
): Promise<void> {
  const list = await getResidents();
  await saveResidents(list.map(r => (r.id === id ? { ...r, ...patch } : r)));
}

export async function removeResident(id: string): Promise<void> {
  const list = await getResidents();
  await saveResidents(list.filter(r => r.id !== id));
}
