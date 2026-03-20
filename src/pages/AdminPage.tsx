import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const ADMIN_API = "https://functions.poehali.dev/eb24b908-2c8f-4b8a-9314-1bab21a85c36";

type AdminTab = "stats" | "products" | "shops" | "offers" | "import";

interface Stats { products: number; shops: number; offers: number; in_stock: number; updated_week: number; }
interface District { id: number; name: string; slug: string; }
interface Category { id: number; name: string; slug: string; icon: string; }
interface Product { id: number; name: string; category: string; category_id: number; description: string; unit: string; brand: string; image_url: string; offers_count: number; min_price: number; max_price: number; }
interface Shop { id: number; name: string; district: string; district_id: number; address: string; phone: string; working_hours: string; rating: number; map_x: number; map_y: number; offers_count: number; }
interface Offer { id: number; product_id: number; product_name: string; shop_id: number; shop_name: string; district: string; price: number; in_stock: boolean; updated_at: string; }

function useAdminApi(token: string) {
  const call = useCallback(async (action: string, body?: object, method = 'POST') => {
    const url = method === 'GET' ? `${ADMIN_API}?action=${action}` : ADMIN_API;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
      ...(method !== 'GET' && { body: JSON.stringify({ action, ...body }) }),
    });
    return res.json();
  }, [token]);
  return { call };
}

// ── Inline form components ────────────────────────────────────────────────────

function Input({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: number | string; onChange: (v: string) => void; options: { id: number; name: string }[] }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
      >
        <option value="">— выберите —</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="X" size={20} /></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-3 flex-1">{children}</div>
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, className = "" }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger"; size?: "sm" | "md"; disabled?: boolean; className?: string }) {
  const base = "rounded-xl font-semibold transition-all disabled:opacity-50";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90",
    ghost: "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10",
    danger: "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30",
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>{children}</button>;
}

// ── Stats panel ───────────────────────────────────────────────────────────────

function StatsPanel({ stats }: { stats: Stats | null }) {
  if (!stats) return <div className="text-gray-500 text-sm">Загрузка...</div>;
  const items = [
    { label: "Товаров", value: stats.products, icon: "Package", color: "text-blue-400" },
    { label: "Магазинов", value: stats.shops, icon: "Store", color: "text-green-400" },
    { label: "Предложений", value: stats.offers, icon: "Tag", color: "text-purple-400" },
    { label: "В наличии", value: stats.in_stock, icon: "CheckCircle", color: "text-emerald-400" },
    { label: "Обновлено за 7 дней", value: stats.updated_week, icon: "RefreshCw", color: "text-orange-400" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map(it => (
        <div key={it.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <Icon name={it.icon} size={22} className={`${it.color} mb-2`} fallback="Circle" />
          <p className="text-2xl font-bold text-white">{it.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{it.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Products panel ────────────────────────────────────────────────────────────

function ProductsPanel({ api, categories }: { api: ReturnType<typeof useAdminApi>; categories: Category[] }) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<Partial<Product> | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.call('get_products', undefined, 'GET');
    setItems(res.data || []);
    setLoading(false);
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!modal?.name || !modal?.category_id) return;
    const action = modal.id ? 'update_product' : 'create_product';
    await api.call(action, modal);
    setModal(null);
    load();
  };

  const del = async (id: number) => {
    if (!confirm('Удалить товар и все его предложения?')) return;
    await api.call('delete_product', { id });
    load();
  };

  const filtered = items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск товара..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none" />
        <Btn onClick={() => setModal({})}>+ Добавить</Btn>
      </div>

      {loading && <p className="text-gray-500 text-sm">Загрузка...</p>}

      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{p.name}</p>
              <p className="text-xs text-gray-500">{p.category} · {p.unit} · {p.brand || 'без бренда'}</p>
              {p.offers_count > 0 && <p className="text-xs text-orange-400">{p.offers_count} предл. · от {p.min_price}₽</p>}
            </div>
            <div className="flex gap-1.5">
              <Btn size="sm" variant="ghost" onClick={() => setModal(p)}>✏️</Btn>
              <Btn size="sm" variant="danger" onClick={() => del(p.id)}>🗑</Btn>
            </div>
          </div>
        ))}
      </div>

      {modal !== null && (
        <Modal title={modal.id ? "Редактировать товар" : "Новый товар"} onClose={() => setModal(null)}>
          <Input label="Название товара *" value={modal.name || ''} onChange={v => setModal({ ...modal, name: v })} />
          <Select label="Категория *" value={modal.category_id || ''} onChange={v => setModal({ ...modal, category_id: +v })} options={categories} />
          <Input label="Единица измерения" value={modal.unit || 'шт'} onChange={v => setModal({ ...modal, unit: v })} placeholder="шт, м², м³, кг..." />
          <Input label="Бренд / Производитель" value={modal.brand || ''} onChange={v => setModal({ ...modal, brand: v })} />
          <div>
            <label className="block text-xs text-gray-400 mb-1">Описание</label>
            <textarea value={modal.description || ''} onChange={e => setModal({ ...modal, description: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <Btn onClick={save} className="flex-1">{modal.id ? "Сохранить" : "Создать"}</Btn>
            <Btn variant="ghost" onClick={() => setModal(null)}>Отмена</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Shops panel ───────────────────────────────────────────────────────────────

function ShopsPanel({ api, districts }: { api: ReturnType<typeof useAdminApi>; districts: District[] }) {
  const [items, setItems] = useState<Shop[]>([]);
  const [modal, setModal] = useState<Partial<Shop> | null>(null);

  const load = useCallback(async () => {
    const res = await api.call('get_shops', undefined, 'GET');
    setItems(res.data || []);
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!modal?.name || !modal?.district_id) return;
    const action = modal.id ? 'update_shop' : 'create_shop';
    await api.call(action, modal);
    setModal(null);
    load();
  };

  const del = async (id: number) => {
    if (!confirm('Удалить магазин и все его предложения?')) return;
    await api.call('delete_shop', { id });
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Btn onClick={() => setModal({})}>+ Добавить магазин</Btn>
      </div>
      <div className="space-y-2">
        {items.map(s => (
          <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{s.name}</p>
              <p className="text-xs text-gray-500">{s.district} · {s.address}</p>
              <p className="text-xs text-gray-600">{s.phone} · {s.working_hours} · ★{s.rating} · {s.offers_count} товаров</p>
            </div>
            <div className="flex gap-1.5">
              <Btn size="sm" variant="ghost" onClick={() => setModal(s)}>✏️</Btn>
              <Btn size="sm" variant="danger" onClick={() => del(s.id)}>🗑</Btn>
            </div>
          </div>
        ))}
      </div>

      {modal !== null && (
        <Modal title={modal.id ? "Редактировать магазин" : "Новый магазин"} onClose={() => setModal(null)}>
          <Input label="Название магазина *" value={modal.name || ''} onChange={v => setModal({ ...modal, name: v })} />
          <Select label="Район *" value={modal.district_id || ''} onChange={v => setModal({ ...modal, district_id: +v })} options={districts} />
          <Input label="Адрес" value={modal.address || ''} onChange={v => setModal({ ...modal, address: v })} placeholder="ул. Ленина, 1" />
          <Input label="Телефон" value={modal.phone || ''} onChange={v => setModal({ ...modal, phone: v })} placeholder="+7 (383) 000-00-00" />
          <Input label="Часы работы" value={modal.working_hours || ''} onChange={v => setModal({ ...modal, working_hours: v })} placeholder="Пн-Вс 8:00-21:00" />
          <Input label="Рейтинг (0-5)" type="number" value={modal.rating || 4} onChange={v => setModal({ ...modal, rating: +v })} />
          <div className="flex gap-2 pt-1">
            <Btn onClick={save} className="flex-1">{modal.id ? "Сохранить" : "Создать"}</Btn>
            <Btn variant="ghost" onClick={() => setModal(null)}>Отмена</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Offers panel ──────────────────────────────────────────────────────────────

function OffersPanel({ api, products, shops }: { api: ReturnType<typeof useAdminApi>; products: Product[]; shops: Shop[] }) {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [modal, setModal] = useState<Partial<Offer> | null>(null);
  const [searchProd, setSearchProd] = useState("");

  const load = useCallback(async (pid: number) => {
    const res = await api.call('get_offers', undefined, 'GET');
    setOffers((res.data || []).filter((o: Offer) => o.product_id === pid));
  }, [api]);

  const save = async () => {
    if (!modal?.product_id || !modal?.shop_id || modal?.price === undefined) return;
    await api.call('upsert_offer', modal);
    setModal(null);
    if (selectedProduct) load(selectedProduct);
  };

  const del = async (id: number) => {
    await api.call('delete_offer', { id });
    if (selectedProduct) load(selectedProduct);
  };

  const filteredProds = products.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Выберите товар</p>
          <input value={searchProd} onChange={e => setSearchProd(e.target.value)} placeholder="Поиск..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none" />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredProds.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProduct(p.id); load(p.id); }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${selectedProduct === p.id ? 'bg-orange-500/20 border border-orange-500/30 text-orange-300' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/8'}`}
              >
                {p.name}
                <span className="text-xs text-gray-500 ml-1">({p.offers_count} пред.)</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Цены в магазинах</p>
            {selectedProduct && (
              <Btn size="sm" onClick={() => setModal({ product_id: selectedProduct })}>+ Добавить</Btn>
            )}
          </div>
          {!selectedProduct && <p className="text-gray-600 text-sm">Выберите товар слева</p>}
          <div className="space-y-1.5">
            {offers.map(o => (
              <div key={o.id} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{o.shop_name}</p>
                  <p className="text-xs text-gray-500">{o.district}</p>
                  <p className={`text-xs font-semibold ${o.in_stock ? 'text-green-400' : 'text-red-400'}`}>
                    {o.price.toLocaleString('ru')} ₽ · {o.in_stock ? 'В наличии' : 'Нет'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Btn size="sm" variant="ghost" onClick={() => setModal(o)}>✏️</Btn>
                  <Btn size="sm" variant="danger" onClick={() => del(o.id)}>🗑</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal !== null && (
        <Modal title={modal.id ? "Изменить цену" : "Добавить предложение"} onClose={() => setModal(null)}>
          {!modal.id && <Select label="Товар *" value={modal.product_id || ''} onChange={v => setModal({ ...modal, product_id: +v })} options={products} />}
          <Select label="Магазин *" value={modal.shop_id || ''} onChange={v => setModal({ ...modal, shop_id: +v })} options={shops} />
          <Input label="Цена (₽) *" type="number" value={modal.price || ''} onChange={v => setModal({ ...modal, price: +v })} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={modal.in_stock !== false} onChange={e => setModal({ ...modal, in_stock: e.target.checked })} className="w-4 h-4 rounded accent-orange-500" />
            <span className="text-sm text-gray-300">В наличии</span>
          </label>
          <div className="flex gap-2 pt-1">
            <Btn onClick={save} className="flex-1">Сохранить</Btn>
            <Btn variant="ghost" onClick={() => setModal(null)}>Отмена</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Bulk import ───────────────────────────────────────────────────────────────

function ImportPanel({ api, categories, shops }: { api: ReturnType<typeof useAdminApi>; categories: Category[]; shops: Shop[] }) {
  const [catId, setCatId] = useState<number | null>(null);
  const [shopId, setShopId] = useState<number | null>(null);
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const doImport = async () => {
    if (!catId || !shopId || !csvText.trim()) return;
    setLoading(true);
    const lines = csvText.trim().split('\n').filter(Boolean);
    const items = lines.map(line => {
      const [product_name, price, unit, brand, in_stock] = line.split(';').map(s => s.trim());
      return { product_name, category_id: catId, shop_id: shopId, price: parseFloat(price) || 0, unit: unit || 'шт', brand: brand || '', in_stock: in_stock !== 'нет' };
    }).filter(i => i.product_name && i.price > 0);
    const res = await api.call('bulk_import', { items });
    setLoading(false);
    if (res.success) {
      setResult(`✅ Добавлено товаров: ${res.data.inserted_products}, обновлено: ${res.data.updated_products}, всего предложений: ${res.data.total_offers}`);
      setCsvText("");
    } else {
      setResult(`❌ Ошибка: ${res.error}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
        <p className="font-semibold mb-1">Формат CSV (разделитель — точка с запятой):</p>
        <code className="text-xs text-blue-200/80 block">Название товара;Цена;Единица;Бренд;Наличие</code>
        <code className="text-xs text-blue-200/60 block mt-0.5">Кирпич облицовочный;12.50;шт;Кемерово;да</code>
        <code className="text-xs text-blue-200/60 block">Доска обрезная 50х150;350;м³;Томск;нет</code>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="Категория для всей загрузки" value={catId || ''} onChange={v => setCatId(+v)} options={categories} />
        <Select label="Магазин для всей загрузки" value={shopId || ''} onChange={v => setShopId(+v)} options={shops} />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Данные CSV</label>
        <textarea
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          rows={10}
          placeholder={"Кирпич облицовочный;12.50;шт;КамСтрой;да\nДоска обрезная;350;м³;ТомскЛес;да"}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none resize-y font-mono"
        />
        <p className="text-xs text-gray-600 mt-1">{csvText.trim().split('\n').filter(Boolean).length} строк</p>
      </div>

      <Btn onClick={doImport} disabled={loading || !catId || !shopId || !csvText.trim()} className="w-full justify-center">
        {loading ? 'Импорт...' : 'Загрузить данные'}
      </Btn>

      {result && (
        <div className={`rounded-xl px-4 py-3 text-sm border ${result.startsWith('✅') ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {result}
        </div>
      )}
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin_token') || '');
  const [inputToken, setInputToken] = useState('');
  const [authError, setAuthError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

  const api = useAdminApi(token);

  const login = async () => {
    setChecking(true);
    setAuthError(false);
    const res = await fetch(`${ADMIN_API}?action=get_stats`, { headers: { 'X-Admin-Token': inputToken } });
    const json = await res.json();
    setChecking(false);
    if (json.success) {
      sessionStorage.setItem('admin_token', inputToken);
      setToken(inputToken);
      setStats(json.data);
    } else {
      setAuthError(true);
    }
  };

  useEffect(() => {
    if (!token) return;
    api.call('get_stats', undefined, 'GET').then(r => r.success && setStats(r.data));
    api.call('get_districts', undefined, 'GET').then(r => setDistricts(r.data || []));
    api.call('get_categories', undefined, 'GET').then(r => setCategories(r.data || []));
    api.call('get_shops', undefined, 'GET').then(r => setShops(r.data || []));
    api.call('get_products', undefined, 'GET').then(r => setProducts(r.data || []));
  }, [token, api]);

  const logout = () => { sessionStorage.removeItem('admin_token'); setToken(''); };

  // Auth screen
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Icon name="Shield" size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg leading-tight">Панель управления</p>
              <p className="text-gray-500 text-xs">Строительные материалы</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Пароль администратора</label>
              <input
                type="password"
                value={inputToken}
                onChange={e => setInputToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && login()}
                placeholder="Введите пароль..."
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 ${authError ? 'border-red-500/50' : 'border-white/10'}`}
              />
              {authError && <p className="text-red-400 text-xs mt-1.5">Неверный пароль</p>}
            </div>
            <button
              onClick={login}
              disabled={checking || !inputToken}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {checking ? 'Проверяем...' : 'Войти'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: "stats", label: "Обзор", icon: "BarChart2" },
    { id: "products", label: "Товары", icon: "Package" },
    { id: "shops", label: "Магазины", icon: "Store" },
    { id: "offers", label: "Цены", icon: "Tag" },
    { id: "import", label: "Загрузка", icon: "Upload" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900/80 border-b border-white/10 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Icon name="Shield" size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm text-white">Админ-панель</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Сайт</a>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Выйти</button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-0 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === t.id ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              <Icon name={t.icon} size={14} fallback="Circle" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === "stats" && (
          <div className="space-y-5">
            <h2 className="font-bold text-xl text-white">Обзор базы данных</h2>
            <StatsPanel stats={stats} />
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-sm text-gray-300 mb-3 font-medium">Быстрые действия</p>
              <div className="flex flex-wrap gap-2">
                <Btn variant="ghost" onClick={() => setActiveTab("products")}>Управление товарами</Btn>
                <Btn variant="ghost" onClick={() => setActiveTab("shops")}>Управление магазинами</Btn>
                <Btn variant="ghost" onClick={() => setActiveTab("import")}>Массовая загрузка CSV</Btn>
              </div>
            </div>
          </div>
        )}
        {activeTab === "products" && (
          <div className="space-y-4">
            <h2 className="font-bold text-xl text-white">Товары</h2>
            <ProductsPanel api={api} categories={categories} />
          </div>
        )}
        {activeTab === "shops" && (
          <div className="space-y-4">
            <h2 className="font-bold text-xl text-white">Магазины</h2>
            <ShopsPanel api={api} districts={districts} />
          </div>
        )}
        {activeTab === "offers" && (
          <div className="space-y-4">
            <h2 className="font-bold text-xl text-white">Цены и наличие</h2>
            <OffersPanel api={api} products={products} shops={shops} />
          </div>
        )}
        {activeTab === "import" && (
          <div className="space-y-4">
            <h2 className="font-bold text-xl text-white">Массовая загрузка</h2>
            <ImportPanel api={api} categories={categories} shops={shops} />
          </div>
        )}
      </main>
    </div>
  );
}
