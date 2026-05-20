import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ShoppingItem, ShoppingItemStatus } from '@/types';

const STORAGE_KEY = '@gerencia:shopping';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function load(): Promise<ShoppingItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as ShoppingItem[]) : [];
}

async function save(items: ShoppingItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function getShoppingItems(): Promise<ShoppingItem[]> {
  return load();
}

export async function addShoppingItem(
  name: string,
  addedById: string,
  addedByName: string,
): Promise<ShoppingItem> {
  const items = await load();
  const now = new Date().toISOString();
  const item: ShoppingItem = {
    id: uid(),
    name: name.trim(),
    addedById,
    addedByName,
    status: 'pendente',
    createdAt: now,
    updatedAt: now,
  };
  await save([item, ...items]);
  return item;
}

export async function updateItemStatus(
  id: string,
  status: ShoppingItemStatus,
  updatedById: string,
  updatedByName: string,
): Promise<void> {
  const items = await load();
  await save(
    items.map(i =>
      i.id === id
        ? { ...i, status, updatedAt: new Date().toISOString(), updatedById, updatedByName }
        : i,
    ),
  );
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const items = await load();
  await save(items.filter(i => i.id !== id));
}
