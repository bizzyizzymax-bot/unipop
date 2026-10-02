import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CONDITION_LABEL = { NEW: "New", GOOD: "Good", POOR: "Poor" };

export function ConditionBadge({ condition }) {
  const style =
    condition === "NEW"
      ? "bg-green-100 text-green-800"
      : condition === "GOOD"
      ? "bg-blue-100 text-blue-800"
      : "bg-amber-100 text-amber-800";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${style}`}
    >
      {CONDITION_LABEL[condition] || condition}
    </span>
  );
}

export default function ProductCard({ product }) {
  const { savedIds, toggleSaved } = useAuth();
  const isSaved = savedIds.includes(product.id);
  const cover =
    product.images && product.images.length > 0 ? product.images[0] : null;

  return (
    <div className="group relative">
      <Link to={`/listing/${product.id}`} className="block">
        <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
          {cover ? (
            <img
              src={cover}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-gray-300">
              📦
            </div>
          )}
        </div>
        <div className="mt-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-black">
              ${product.price?.toFixed(2)}
            </p>
            <p className="truncate text-xs text-gray-500">{product.title}</p>
            <p className="truncate text-[11px] text-gray-400">
              {product.subcategory || product.category}
              {product.size ? ` · Size ${product.size}` : ""}
              {product.gender ? ` · ${product.gender}` : ""}
            </p>
          </div>
          <div className="pt-1">
            <ConditionBadge condition={product.condition} />
          </div>
        </div>
      </Link>

      {product.status === "SOLD" && (
        <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-[10px] font-bold text-white">
          SOLD
        </span>
      )}

      <button
        type="button"
        aria-label={isSaved ? "Unsave listing" : "Save listing"}
        onClick={(e) => {
          e.preventDefault();
          toggleSaved(product.id);
        }}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm transition hover:scale-110"
      >
        {isSaved ? "❤️" : "🤍"}
      </button>
    </div>
  );
}
