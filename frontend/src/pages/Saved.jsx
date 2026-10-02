import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useAuth } from "../context/AuthContext";
import { savedApi } from "../lib/api";

export default function Saved() {
  const { savedIds } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    savedApi
      .list()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // Re-load whenever a listing is hearted / unhearted anywhere in the app.
  }, [savedIds.length]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Saved listings</h1>
          <p className="text-sm text-gray-500">
            Your hearted items — keep an eye on them before someone else grabs
            them at move-out.
          </p>
        </div>
        <Link
          to="/browse"
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:border-black"
        >
          Browse more
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-xl bg-gray-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl">🤍</p>
          <p className="mt-2 font-semibold">Nothing saved yet</p>
          <p className="text-sm text-gray-500">
            Tap the heart on any listing to save it here.
          </p>
          <Link
            to="/browse"
            className="mt-4 inline-block rounded-full bg-black px-5 py-2 text-sm font-semibold text-white"
          >
            Start browsing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
