import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiFetch } from "./types";
import type { Tab, District, Category, Product, Shop, MapDistrict } from "./types";
import HomeTab from "./HomeTab";
import SearchTab from "./SearchTab";
import { CategoriesTab, MapTab, FavoritesTab } from "./OtherTabs";

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

  useEffect(() => {
    apiFetch<District>({ action: 'districts' }).then(setDistricts);
    apiFetch<Category>({ action: 'categories' }).then(setCategories);
    apiFetch<MapDistrict>({ action: 'map_districts' }).then(setMapDistricts);
  }, []);

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

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDistrict(null);
    setSelectedCategory(null);
    setOnlyInStock(false);
    setMinRating(0);
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
        {activeTab === "home" && (
          <HomeTab
            districts={districts}
            categories={categories}
            products={products}
            favorites={favorites}
            loading={loading}
            searchQuery={searchQuery}
            selectedDistrict={selectedDistrict}
            setSearchQuery={setSearchQuery}
            setActiveTab={setActiveTab}
            setSelectedDistrict={setSelectedDistrict}
            goSearch={goSearch}
            toggleFavorite={toggleFavorite}
          />
        )}

        {activeTab === "search" && (
          <SearchTab
            districts={districts}
            categories={categories}
            products={products}
            favorites={favorites}
            loading={loading}
            searchQuery={searchQuery}
            selectedDistrict={selectedDistrict}
            selectedCategory={selectedCategory}
            onlyInStock={onlyInStock}
            minRating={minRating}
            showFilters={showFilters}
            setSearchQuery={setSearchQuery}
            setSelectedDistrict={setSelectedDistrict}
            setSelectedCategory={setSelectedCategory}
            setOnlyInStock={setOnlyInStock}
            setMinRating={setMinRating}
            setShowFilters={setShowFilters}
            toggleFavorite={toggleFavorite}
            resetFilters={resetFilters}
          />
        )}

        {activeTab === "categories" && (
          <CategoriesTab
            categories={categories}
            goSearch={goSearch}
          />
        )}

        {activeTab === "map" && (
          <MapTab
            mapDistricts={mapDistricts}
            shops={shops}
            districts={districts}
            selectedMapDistrict={selectedMapDistrict}
            setSelectedMapDistrict={setSelectedMapDistrict}
            goSearch={goSearch}
          />
        )}

        {activeTab === "favorites" && (
          <FavoritesTab
            favoriteProducts={favoriteProducts}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            setActiveTab={setActiveTab}
          />
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
