import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function dedupeById<T extends { id?: string | number }>(items: T[]) {
  const map = new Map<string | number, T>();
  for (const it of items || []) {
    if (it?.id != null) map.set(it.id as string | number, it);
  }
  return Array.from(map.values());
}
