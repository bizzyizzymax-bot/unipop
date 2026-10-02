import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { reviewApi } from "../lib/api";

/** Renders filled/empty stars for a 1-5 rating. */
export function Stars({ rating }) {
  const r = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <span className="text-xs text-amber-500" aria-label={`${r} out of 5 stars`}>
      {"★".repeat(r)}
      <span className="text-gray-300">{"★".repeat(5 - r)}</span>
    </span>
  );
}

/**
 * Reviews written by other students about the given user.
 * Your own review is highlighted and can be deleted (so you can write a
 * new one). `onDeleted` lets the parent re-sync its review form.
 */
export default function ReviewList({
  userId,
  heading = "Reviews",
  refreshKey = 0,
  onDeleted,
}) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(null); // null = loading
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const onDeletedRef = useRef(onDeleted);
  onDeletedRef.current = onDeleted;

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await reviewApi.list(userId);
      setReviews(data);
    } catch {
      setReviews([]);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function removeMine(review) {
    if (!window.confirm("Delete your review? You can write a new one after.")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await reviewApi.remove(review.id);
      if (onDeletedRef.current) {
        onDeletedRef.current(); // parent bumps refreshKey -> both reload
      } else {
        await load();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!userId) return null;

  if (reviews === null) {
    return <div className="mt-6 h-20 animate-pulse rounded-2xl bg-gray-100" />;
  }

  const avg = reviews.length
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase text-gray-500">{heading}</h2>
        {reviews.length > 0 && (
          <span className="text-sm font-semibold">
            <span className="text-amber-500">★</span> {avg.toFixed(1)} ·{" "}
            {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">
          No reviews yet — reviews come from other students after they buy.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {reviews.map((r, i) => {
            const mine = r.buyerId != null && r.buyerId === user?.id;
            return (
              <li
                key={`${r.buyerId}-${i}`}
                className={`rounded-xl p-3 ${
                  mine ? "bg-green-50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">
                    {mine ? "You" : r.buyerFirstName || r.buyerUsername}
                    {!mine && r.buyerFirstName && r.buyerUsername && (
                      <span className="font-normal text-gray-500">
                        {" "}
                        @{r.buyerUsername}
                      </span>
                    )}
                  </p>
                  <Stars rating={r.rating} />
                </div>
                {r.comment && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {r.comment}
                  </p>
                )}
                {mine && (
                  <button
                    type="button"
                    onClick={() => removeMine(r)}
                    disabled={busy}
                    className="mt-2 rounded-full border border-red-300 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {busy ? "Deleting…" : "🗑 Delete my review"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
