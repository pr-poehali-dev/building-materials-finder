import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/b2d61419-950a-4c95-a0ae-7d90f686d708";

const CATEGORY_COLORS: Record<string, string> = {
  'kirpich': 'from-orange-500 to-red-500',
  'pilomaterialy': 'from-green-500 to-emerald-600',
  'truby': 'from-blue-500 to-cyan-500',
  'otdelka': 'from-purple-500 to-pink-500',
  'elektrika': 'from-yellow-500 to-orange-500',
  'instrumenty': 'from-slate-500 to-slate-700',
  'krovlya': 'from-teal-500 to-cyan-600',
  'utepliteli': 'from-rose-500 to-pink-600',
};

type Tab = "home" | "search" | "categories" | "map" | "favorites";

interface District { id: number; name: string; slug: string; }
interface Category { id: number; name: string; slug: string; icon: string; }
interface Product {
  id: number; name: string; category: string; unit: string; brand: string;
  description: string; min_price: number; max_price: number; in_stock: boolean;
  rating: number; shops_count: number; district: string;
  best_shop: string; best_price: number;
}
interface Shop {
  id: number; name: string; district: string; address: string;
  phone: string; working_hours: string; rating: number;
  map_x: number; map_y: number; products_count: number;
}
interface MapDistrict {
  id: number; name: string; slug: string; shops: number; map_x: number; map_y: number;
}

async function apiFetch<T>(params: Record<string, string>): Promise<T[]> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}?${qs}`);
  const json = await res.json();
  return json.data ?? [];
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mapDistricts, setMapDistricts] = useState<MapDistrict[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [selectedMapDistrict, setSelectedMapDistrict] = useState<MapDistrict | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Загружаем справочники при старте
  useEffect(() => {
    apiFetch<District>({ action: 'districts' }).then(setDistricts);
    apiFetch<Category>({ action: 'categories' }).then(setCategories);
    apiFetch<MapDistrict>({ action: 'map_districts' }).then(setMapDistricts);
  }, []);

  // Загружаем товары при смене фильтров
  const loadProducts = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = { action: 'products' };
    if (searchQuery) params.search = searchQuery;
    if (selectedDistrict) params.district_id = String(selectedDistrict.id);
    if (selectedCategory) params.category_id = String(selectedCategory.id);
    if (onlyInStock) params.in_stock = 'true';
    if (minRating > 0) params.min_rating = String(minRating);
    const data = await apiFetch<Product>(params);
    setProducts(data);
    setLoading(false);
  }, [searchQuery, selectedDistrict, selectedCategory, onlyInStock, minRating]);

  useEffect(() => {
    if (activeTab === 'search' || activeTab === 'home') {
      loadProducts();
    }
  }, [loadProducts, activeTab]);

  // Загружаем магазины для карты
  useEffect(() => {
    if (activeTab === 'map') {
      const params: Record<string, string> = { action: 'shops' };
      if (selectedMapDistrict) params.district_id = String(selectedMapDistrict.id);
      apiFetch<Shop>(params).then(setShops);
    }
  }, [activeTab, selectedMapDistrict]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  const goSearch = (district?: District, category?: Category) => {
    if (district) setSelectedDistrict(district);
    if (category) setSelectedCategory(category);
    setActiveTab("search");
  };

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-white overflow-x-hidden">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500 rounded-full opacity-10 blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-600 rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute -bottom-20 right-1/3 w-64 h-64 bg-purple-600 rounded-full opacity-8 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center animate-pulse-glow">
                <Icon name="HardHat" size={16} className="text-white" />
              </div>
              <span className="font-display text-xl font-bold tracking-wide text-white">СТРОЙПОИСК</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 ml-10">Новосибирск · {products.length > 0 ? `${products.length} материалов` : 'загрузка...'}</p>
          </div>
          <button
            onClick={() => setActiveTab("favorites")}
            className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Icon name="Heart" size={18} className={favorites.length > 0 ? "text-red-400 fill-red-400" : "text-gray-400"} />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {favorites.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 pb-28">

        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="px-4 space-y-6 animate-fade-in">
            {/* Hero banner */}
            <div className="relative rounded-2xl overflow-hidden h-48">
              <img
                src="https://cdn.poehali.dev/projects/ea86b614-d838-48af-88ca-665ae9c630c5/files/3cfef84d-6812-4144-b573-f5fb13ab17cc.jpg"
                alt="Новосибирск"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-950/50 to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">{districts.length} районов</p>
                <h2 className="font-display text-2xl font-bold text-white leading-tight">Найди материалы<br />рядом с домом</h2>
                <p className="text-gray-300 text-sm mt-1">Без регистрации · Сразу цены</p>
              </div>
            </div>

            {/* Quick search */}
            <div className="relative">
              <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Кирпич, цемент, доска..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setActiveTab("search"); }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:bg-white/8 transition-all"
              />
            </div>

            {/* District pills */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">По районам</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedDistrict(null)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    !selectedDistrict
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  Все районы
                </button>
                {districts.map(d => (
                  <button
                    key={d.id}
                    onClick={() => goSearch(d)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedDistrict?.id === d.id
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
                        : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Категории</h3>
              <div className="grid grid-cols-2 gap-3">
                {categories.slice(0, 4).map((cat) => {
                  const color = CATEGORY_COLORS[cat.slug] || 'from-gray-500 to-gray-700';
                  return (
                    <button
                      key={cat.id}
                      onClick={() => goSearch(undefined, cat)}
                      className="relative rounded-2xl overflow-hidden p-4 text-left group"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                      <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                      <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                        <Icon name={cat.icon} size={20} className="text-white" fallback="Package" />
                      </div>
                      <p className="relative text-sm font-semibold text-white leading-tight">{cat.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Popular products */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Популярное</h3>
                <button onClick={() => setActiveTab("search")} className="text-orange-400 text-sm font-medium">Все →</button>
              </div>
              {loading ? (
                <LoadingSkeleton />
              ) : (
                <div className="space-y-3">
                  {products.slice(0, 4).map(p => (
                    <ProductCard key={p.id} product={p} isFav={favorites.includes(p.id)} onToggleFav={toggleFavorite} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEARCH TAB */}
        {activeTab === "search" && (
          <div className="px-4 space-y-4 animate-fade-in">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Найти материал..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${showFilters ? "bg-orange-500 border-orange-500 text-white" : "bg-white/5 border-white/10 text-gray-300"}`}
              >
                <Icon name="SlidersHorizontal" size={18} />
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4 animate-scale-in">
                <h4 className="font-semibold text-white">Фильтры</h4>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Район</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedDistrict(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!selectedDistrict ? "bg-orange-500 text-white" : "bg-white/5 border border-white/10 text-gray-300"}`}
                    >
                      Все
                    </button>
                    {districts.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDistrict(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedDistrict?.id === d.id ? "bg-orange-500 text-white" : "bg-white/5 border border-white/10 text-gray-300"}`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Категория</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!selectedCategory ? "bg-orange-500 text-white" : "bg-white/5 border border-white/10 text-gray-300"}`}
                    >
                      Все
                    </button>
                    {categories.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory?.id === c.id ? "bg-orange-500 text-white" : "bg-white/5 border border-white/10 text-gray-300"}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">Только в наличии</span>
                  <button
                    onClick={() => setOnlyInStock(!onlyInStock)}
                    className={`w-12 h-6 rounded-full transition-all relative ${onlyInStock ? "bg-orange-500" : "bg-white/10"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${onlyInStock ? "left-7" : "left-1"}`} />
                  </button>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Рейтинг от {minRating || 'любой'}</label>
                  <div className="flex gap-2">
                    {[0, 4, 4.5].map(r => (
                      <button
                        key={r}
                        onClick={() => setMinRating(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${minRating === r ? "bg-orange-500 text-white" : "bg-white/5 border border-white/10 text-gray-300"}`}
                      >
                        {r === 0 ? 'Все' : `★ ${r}+`}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedDistrict(null); setSelectedCategory(null); setOnlyInStock(false); setMinRating(0); setSearchQuery(''); }}
                  className="w-full text-center text-orange-400 text-sm py-1"
                >
                  Сбросить все фильтры
                </button>
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-gray-400">
                {loading ? 'Поиск...' : <>Найдено: <span className="text-white font-semibold">{products.length}</span></>}
              </p>
              <div className="flex gap-2 flex-wrap">
                {selectedDistrict && (
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30 flex items-center gap-1">
                    {selectedDistrict.name}
                    <button onClick={() => setSelectedDistrict(null)} className="ml-1 opacity-70 hover:opacity-100">×</button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-1">
                    {selectedCategory.name}
                    <button onClick={() => setSelectedCategory(null)} className="ml-1 opacity-70 hover:opacity-100">×</button>
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="SearchX" size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Ничего не найдено</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedDistrict(null); setSelectedCategory(null); setOnlyInStock(false); setMinRating(0); }}
                  className="mt-3 text-orange-400 text-sm"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} isFav={favorites.includes(p.id)} onToggleFav={toggleFavorite} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="px-4 space-y-4 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-white">Категории</h2>
            <div className="grid grid-cols-1 gap-3">
              {categories.map((cat) => {
                const color = CATEGORY_COLORS[cat.slug] || 'from-gray-500 to-gray-700';
                return (
                  <button
                    key={cat.id}
                    onClick={() => goSearch(undefined, cat)}
                    className="relative flex items-center gap-4 p-4 rounded-2xl overflow-hidden group text-left"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className="absolute inset-0 border border-white/10 rounded-2xl" />
                    <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                      <Icon name={cat.icon} size={24} className="text-white" fallback="Package" />
                    </div>
                    <div className="relative flex-1">
                      <p className="font-semibold text-white text-base">{cat.name}</p>
                      <p className="text-sm text-gray-400">Смотреть товары</p>
                    </div>
                    <Icon name="ChevronRight" size={20} className="relative text-gray-500 group-hover:text-orange-400 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === "map" && (
          <div className="px-4 space-y-4 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-white">Карта районов</h2>
            <p className="text-gray-400 text-sm">Выберите район для просмотра магазинов</p>

            {/* Schematic map */}
            <div className="relative bg-gradient-to-br from-blue-950/60 to-slate-900/60 border border-white/10 rounded-2xl overflow-hidden" style={{ height: 320 }}>
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.05) 40px,rgba(255,255,255,0.05) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.05) 40px,rgba(255,255,255,0.05) 41px)"
                }}
              />
              <div className="absolute" style={{ left: "30%", top: "20%", width: "8%", height: "65%", background: "linear-gradient(180deg, rgba(59,130,246,0.4), rgba(37,99,235,0.3))", borderRadius: "40%", filter: "blur(4px)" }} />
              <p className="absolute text-blue-400/60 text-xs font-medium" style={{ left: "27%", top: "45%", transform: "rotate(-85deg)" }}>р. Обь</p>

              {mapDistricts.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedMapDistrict(selectedMapDistrict?.id === d.id ? null : d)}
                  className={`absolute flex flex-col items-center gap-1 transition-all hover:scale-110 ${selectedMapDistrict?.id === d.id ? "scale-110" : ""}`}
                  style={{ left: `${d.map_x}%`, top: `${d.map_y}%`, transform: "translate(-50%, -50%)" }}
                >
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                    selectedMapDistrict?.id === d.id
                      ? "bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/50 text-white"
                      : "bg-blue-600/60 border-blue-400/50 text-blue-200 hover:bg-orange-500/60"
                  }`}>
                    {d.shops}
                  </div>
                  <span className={`text-[9px] font-medium whitespace-nowrap px-1.5 py-0.5 rounded-md transition-all ${
                    selectedMapDistrict?.id === d.id ? "bg-orange-500/30 text-orange-300" : "bg-black/40 text-gray-400"
                  }`}>
                    {d.name.replace(/ский|жный|ный|ский/, '').slice(0, 8)}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected district info */}
            {selectedMapDistrict && (
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-2xl p-4 animate-scale-in">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-xl font-bold text-white">{selectedMapDistrict.name} район</h3>
                  <span className="bg-orange-500/30 text-orange-300 text-sm font-semibold px-3 py-1 rounded-full">{selectedMapDistrict.shops} магазинов</span>
                </div>
                {/* Shops list */}
                <div className="space-y-2 mb-3">
                  {shops.slice(0, 3).map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-white">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-yellow-400">★ {s.rating}</p>
                        <p className="text-xs text-gray-500">{s.working_hours?.split(' ')[1] || ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => goSearch(districts.find(d => d.name === selectedMapDistrict.name))}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Смотреть материалы →
                </button>
              </div>
            )}

            {/* Districts list */}
            <div className="grid grid-cols-2 gap-2">
              {mapDistricts.map(d => (
                <button
                  key={d.id}
                  onClick={() => { setSelectedMapDistrict(d); }}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 hover:bg-white/8 transition-colors"
                >
                  <span className="text-sm text-white font-medium">{d.name}</span>
                  <span className="text-xs text-orange-400">{d.shops} маг.</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAVORITES TAB */}
        {activeTab === "favorites" && (
          <div className="px-4 space-y-4 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-white">Избранное</h2>
            {favoriteProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <Icon name="Heart" size={36} className="text-gray-600" />
                </div>
                <p className="text-gray-400 font-medium">Нет избранных товаров</p>
                <p className="text-gray-600 text-sm mt-1">Нажмите ♡ на карточке товара</p>
                <button
                  onClick={() => setActiveTab("search")}
                  className="mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold text-sm"
                >
                  Найти материалы
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteProducts.map(p => (
                  <ProductCard key={p.id} product={p} isFav={true} onToggleFav={toggleFavorite} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-center justify-around px-2 py-2">
          {([
            { id: "home", icon: "Home", label: "Главная" },
            { id: "search", icon: "Search", label: "Поиск" },
            { id: "categories", icon: "LayoutGrid", label: "Категории" },
            { id: "map", icon: "MapPin", label: "Карта" },
            { id: "favorites", icon: "Heart", label: "Избранное" },
          ] as { id: Tab; icon: string; label: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                activeTab === tab.id ? "text-orange-400" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className={`relative ${activeTab === tab.id ? "scale-110" : ""} transition-transform`}>
                <Icon
                  name={tab.icon}
                  size={22}
                  fallback="Circle"
                  className={tab.id === "favorites" && favorites.length > 0 ? "fill-red-400 text-red-400" : ""}
                />
                {activeTab === tab.id && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium ${activeTab === tab.id ? "text-orange-400" : ""}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 animate-pulse">
          <div className="w-16 h-16 rounded-xl bg-white/10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded-lg w-3/4" />
            <div className="h-3 bg-white/5 rounded-lg w-1/2" />
            <div className="h-4 bg-white/10 rounded-lg w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductCard({ product, isFav, onToggleFav }: {
  product: Product;
  isFav: boolean;
  onToggleFav: (id: number) => void;
}) {
  return (
    <div className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 hover:bg-white/8 transition-all group">
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-500/20 to-slate-700/20 flex items-center justify-center">
        <Icon name="Package" size={28} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{product.name}</p>
          <button
            onClick={() => onToggleFav(product.id)}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <Icon name="Heart" size={16} className={isFav ? "fill-red-400 text-red-400" : "text-gray-500"} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {product.district && (
            <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">{product.district}</span>
          )}
          <span className="text-[10px] text-yellow-400">★ {product.rating}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md ${product.in_stock ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {product.in_stock ? "В наличии" : "Нет"}
          </span>
          {product.shops_count > 1 && (
            <span className="text-[10px] text-blue-400">{product.shops_count} магазина</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-orange-400 font-bold text-base">
              {product.best_price.toLocaleString('ru-RU')} ₽
            </span>
            <span className="text-gray-500 text-xs ml-1">/ {product.unit}</span>
          </div>
          <span className="text-xs text-gray-500 truncate max-w-[100px]">{product.best_shop}</span>
        </div>
      </div>
    </div>
  );
}
