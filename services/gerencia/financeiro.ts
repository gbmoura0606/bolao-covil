import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense, Resident, ResidentBalance, Transfer } from '@/types';
import { getResidents } from './residents';

const STORAGE_KEY = '@gerencia:expenses';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function formatBRL(value: number): string {
  const abs = Math.abs(value);
  const str = abs.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${str}`;
}

export function displayDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-');
  return `${d}/${m}/${y}`;
}

async function load(): Promise<Expense[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Expense[]) : [];
}

export async function getExpenses(): Promise<Expense[]> {
  return load();
}

export async function getExpensesByMonth(month: string): Promise<Expense[]> {
  const all = await load();
  return all.filter(e => e.competencyMonth === month);
}

export async function addExpense(
  data: Omit<Expense, 'id' | 'createdAt'>,
): Promise<Expense> {
  const all = await load();
  const expense: Expense = { ...data, id: uid(), createdAt: new Date().toISOString() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...all, expense]));
  return expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const all = await load();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(e => e.id !== id)));
}

export async function getAvailableMonths(): Promise<string[]> {
  const all = await load();
  const set = new Set(all.map(e => e.competencyMonth));
  set.add(currentMonth());
  return Array.from(set).sort().reverse();
}

// ─── Cálculos de fechamento ───────────────────────────────────────────────────

export function computeBalances(
  expenses: Expense[],
  residents: Resident[],
): ResidentBalance[] {
  const active = residents.filter(r => r.active);
  const paid: Record<string, number> = {};
  const owes: Record<string, number> = {};
  for (const r of active) { paid[r.id] = 0; owes[r.id] = 0; }

  for (const e of expenses) {
    if (e.paidById in paid) paid[e.paidById] += e.amount;

    if (e.splitType === 'igual') {
      const share = e.amount / active.length;
      for (const r of active) owes[r.id] += share;
    } else {
      const totalW = active.reduce((s, r) => s + r.weight, 0);
      for (const r of active) owes[r.id] += (r.weight / totalW) * e.amount;
    }
  }

  return active.map(r => ({
    resident: r,
    paid: paid[r.id] ?? 0,
    owes: owes[r.id] ?? 0,
    balance: (paid[r.id] ?? 0) - (owes[r.id] ?? 0),
  }));
}

/**
 * Algoritmo guloso de liquidação mínima: gera o menor número de transferências
 * necessárias para zerar todos os saldos.
 */
export function computeTransfers(balances: ResidentBalance[]): Transfer[] {
  const debtors = balances
    .filter(b => b.balance < -0.005)
    .map(b => ({ resident: b.resident, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter(b => b.balance > 0.005)
    .map(b => ({ resident: b.resident, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    transfers.push({ from: debtors[i].resident, to: creditors[j].resident, amount });
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.005) i++;
    if (creditors[j].amount < 0.005) j++;
  }

  return transfers;
}

export async function computeMonthSummary(month: string) {
  const [expenses, residents] = await Promise.all([
    getExpensesByMonth(month),
    getResidents(),
  ]);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const balances = computeBalances(expenses, residents);
  const transfers = computeTransfers(balances);
  return { month, label: monthLabel(month), expenses, total, balances, transfers };
}
