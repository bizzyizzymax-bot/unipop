import { useCallback, useEffect, useState } from "react";
import FilterSidebar from "../components/FilterSidebar";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { productApi } from "../lib/api";

const EMPTY = {
  category: "",
  subcategory: "",
  gender: "",
  condition: "",
  size: "",
  search: "",
  minPrice: "",
  maxPrice: "",
};

export default function Browse() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState({ categories: [], conditions: [] });
  const [filters, setFilters] = useState(EMPTY);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    productApi
      .categories()
      .then(setCatalog)
      .catch(() => {});
  }, []);

  const load = useCallback(async (current) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        category: current.category,
        subcategory: current.subcategory,
        gender: current.gender,
        condition: current.condition,
        size: current.size,
        search: current.search,
        minPrice: current.minPrice,
        maxPrice: current.maxPrice,
      };
      const data = await productApi.list(params);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(filters), 250);
    return () => clearTimeout(timer);
  }, [filters, load]);

  const update = (patch) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search listings — desks, textbooks, subleases…"
            className="w-full rounded-full border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-black focus:bg-white focus:outline-none"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
        <span className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white">
          🎓 {user?.schoolDomain} only
        </span>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar
          categories={catalog.categories}
          filters={filters}
          onChange={update}
          onReset={() => setFilters(EMPTY)}
        />

        <section className="flex-1">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">
              {filters.category || "All listings"}
              {filters.subcategory ? ` · ${filters.subcategory}` : ""}
            </h2>
            <span className="text-sm text-gray-500">
              {products.length} item{products.length === 1 ? "" : "s"}
            </span>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-xl bg-gray-100" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-4xl">🧹</p>
              <p className="mt-2 font-semibold">
                No listings yet on your campus
              </p>
              <p className="text-sm text-gray-500">
                Try different filters, or be the first to post something.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
