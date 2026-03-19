import Icon from "@/components/ui/icon";
import YandexAd from "@/components/YandexAd";
import { RSY_BLOCK_ID } from "./types";
import type { District, Category, Product } from "./types";
import { ProductCard, LoadingSkeleton } from "./shared";

interface SearchTabProps {
  districts: District[];
  categories: Category[];
  products: Product[];
  favorites: number[];
  loading: boolean;
  searchQuery: string;
  selectedDistrict: District | null;
  selectedCategory: Category | null;
  onlyInStock: boolean;
  minRating: number;
  showFilters: boolean;
  setSearchQuery: (q: string) => void;
  setSelectedDistrict: (d: District | null) => void;
  setSelectedCategory: (c: Category | null) => void;
  setOnlyInStock: (v: boolean) => void;
  setMinRating: (r: number) => void;
  setShowFilters: (v: boolean) => void;
  toggleFavorite: (id: number) => void;
  resetFilters: () => void;
}

export default function SearchTab({
  districts, categories, products, favorites, loading,
  searchQuery, selectedDistrict, selectedCategory,
  onlyInStock, minRating, showFilters,
  setSearchQuery, setSelectedDistrict, setSelectedCategory,
  setOnlyInStock, setMinRating, setShowFilters,
  toggleFavorite, resetFilters,
}: SearchTabProps) {
  return (
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
            onClick={resetFilters}
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
          <button onClick={resetFilters} className="mt-3 text-orange-400 text-sm">
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p, i) => (
            <>
              <ProductCard key={p.id} product={p} isFav={favorites.includes(p.id)} onToggleFav={toggleFavorite} />
              {(i + 1) % 5 === 0 && i < products.length - 1 && (
                <YandexAd key={`ad-${i}`} blockId={RSY_BLOCK_ID} className="my-1" />
              )}
            </>
          ))}
        </div>
      )}
    </div>
  );
}
