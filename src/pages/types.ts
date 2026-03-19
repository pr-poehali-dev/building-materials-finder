export const RSY_BLOCK_ID = "R-A-XXXXXXX-1";
export const API_URL = "https://functions.poehali.dev/b2d61419-950a-4c95-a0ae-7d90f686d708";

export const CATEGORY_COLORS: Record<string, string> = {
  'kirpich': 'from-orange-500 to-red-500',
  'pilomaterialy': 'from-green-500 to-emerald-600',
  'truby': 'from-blue-500 to-cyan-500',
  'otdelka': 'from-purple-500 to-pink-500',
  'elektrika': 'from-yellow-500 to-orange-500',
  'instrumenty': 'from-slate-500 to-slate-700',
  'krovlya': 'from-teal-500 to-cyan-600',
  'utepliteli': 'from-rose-500 to-pink-600',
};

export type Tab = "home" | "search" | "categories" | "map" | "favorites";

export interface District { id: number; name: string; slug: string; }
export interface Category { id: number; name: string; slug: string; icon: string; }
export interface Product {
  id: number; name: string; category: string; unit: string; brand: string;
  description: string; min_price: number; max_price: number; in_stock: boolean;
  rating: number; shops_count: number; district: string;
  best_shop: string; best_price: number;
}
export interface Shop {
  id: number; name: string; district: string; address: string;
  phone: string; working_hours: string; rating: number;
  map_x: number; map_y: number; products_count: number;
}
export interface MapDistrict {
  id: number; name: string; slug: string; shops: number; map_x: number; map_y: number;
}

export async function apiFetch<T>(params: Record<string, string>): Promise<T[]> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}?${qs}`);
  const json = await res.json();
  return json.data ?? [];
}
