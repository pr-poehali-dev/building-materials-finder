import Icon from "@/components/ui/icon";
import YandexAd from "@/components/YandexAd";
import { RSY_BLOCK_ID, CATEGORY_COLORS } from "./types";
import type { District, Category, Product, Tab } from "./types";
import { ProductCard, LoadingSkeleton } from "./shared";

interface HomeTabProps {
  districts: District[];
  categories: Category[];
  products: Product[];
  favorites: number[];
  loading: boolean;
  searchQuery: string;
  selectedDistrict: District | null;
  setSearchQuery: (q: string) => void;
  setActiveTab: (tab: Tab) => void;
  setSelectedDistrict: (d: District | null) => void;
  goSearch: (district?: District, category?: Category) => void;
  toggleFavorite: (id: number) => void;
}

export default function HomeTab({
  districts, categories, products, favorites, loading,
  searchQuery, selectedDistrict,
  setSearchQuery, setActiveTab, setSelectedDistrict,
  goSearch, toggleFavorite,
}: HomeTabProps) {
  return (
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

      {/* Ad block — after categories */}
      <YandexAd blockId={RSY_BLOCK_ID} />

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
  );
}
