import Icon from "@/components/ui/icon";
import { CATEGORY_COLORS } from "./types";
import type { District, Category, Product, MapDistrict, Shop, Tab } from "./types";
import { ProductCard } from "./shared";

// ─── CATEGORIES TAB ────────────────────────────────────────────────────────────

interface CategoriesTabProps {
  categories: Category[];
  goSearch: (district?: District, category?: Category) => void;
}

export function CategoriesTab({ categories, goSearch }: CategoriesTabProps) {
  return (
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
  );
}

// ─── MAP TAB ───────────────────────────────────────────────────────────────────

interface MapTabProps {
  mapDistricts: MapDistrict[];
  shops: Shop[];
  districts: District[];
  selectedMapDistrict: MapDistrict | null;
  setSelectedMapDistrict: (d: MapDistrict | null) => void;
  goSearch: (district?: District, category?: Category) => void;
}

export function MapTab({
  mapDistricts, shops, districts,
  selectedMapDistrict, setSelectedMapDistrict, goSearch,
}: MapTabProps) {
  return (
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
            onClick={() => setSelectedMapDistrict(d)}
            className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 hover:bg-white/8 transition-colors"
          >
            <span className="text-sm text-white font-medium">{d.name}</span>
            <span className="text-xs text-orange-400">{d.shops} маг.</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── FAVORITES TAB ─────────────────────────────────────────────────────────────

interface FavoritesTabProps {
  favoriteProducts: Product[];
  favorites: number[];
  toggleFavorite: (id: number) => void;
  setActiveTab: (tab: Tab) => void;
}

export function FavoritesTab({ favoriteProducts, favorites, toggleFavorite, setActiveTab }: FavoritesTabProps) {
  return (
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
  );
}
