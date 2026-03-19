import Icon from "@/components/ui/icon";
import type { Product } from "./types";

export function LoadingSkeleton() {
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

export function ProductCard({ product, isFav, onToggleFav }: {
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
