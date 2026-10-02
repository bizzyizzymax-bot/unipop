import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { conversationApi, reviewApi } from "../lib/api";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none";

/**
 * One review per student pair:
 * - If you haven't reviewed this student yet, a button expands into a
 *   star + comment form.
 * - If you already reviewed them, the button becomes "delete my review"
 *   so you can write a fresh one afterwards.
 *
 * `refreshKey` re-checks whether you already reviewed (bump it after any
 * create/delete so this component and the review list stay in sync).
 */
export default function ReviewForm({
  sellerId,
  label = "⭐ Write a review",
  refreshKey = 0,
  onChanged,
}) {
  const { user } = useAuth();
  const [mine, setMine] = useState(null); // my existing review of this student
  const [contacted, setContacted] = useState(null); // have I messaged them?
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Reviews are only allowed after messaging: check both conditions.
  useEffect(() => {
    if (!sellerId) return;
    let cancelled = false;
    reviewApi
      .list(sellerId)
      .then((data) => {
        if (cancelled) return;
        setMine(data.find((r) => r.buyerId === user?.id) || null);
        setOpen(false);
      })
      .catch(() => {
        if (!cancelled) setMine(null);
      });
    conversationApi
      .contacted(sellerId)
      .then((data) => {
        if (!cancelled) setContacted(!!data?.contacted);
      })
      .catch(() => {
        if (!cancelled) setContacted(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId, user?.id, refreshKey]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await reviewApi.create({
        sellerId,
        rating,
        comment: comment.trim() || null,
      });
      setComment("");
      setOpen(false);
      setMine(created);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteMine() {
    if (!mine) return;
    if (!window.confirm("Delete your review? You can write a new one after.")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await reviewApi.remove(mine.id);
      setMine(null);
      setDone(false);
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!sellerId) return null;

  // Already reviewed: offer deletion (which unlocks writing a new one).
  if (mine) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-green-600">
          ✓ You reviewed this student
        </span>
        <button
          type="button"
          onClick={deleteMine}
          disabled={busy}
          className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          {busy ? "Deleting…" : "🗑 Delete my review"}
        </button>
        {error && (
          <span className="text-xs font-semibold text-red-600">{error}</span>
        )}
      </div>
    );
  }

  // Not messaged yet: reviews are only allowed after you've chatted.
  if (contacted === false) {
    return (
      <p className="text-xs font-semibold text-gray-500">
        💬 Message this student first — you can leave a review once you've
        chatted.
      </p>
    );
  }

  if (contacted === null) return null; // still checking

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setError("");
            setOpen(true);
          }}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:border-black"
        >
          {label}
        </button>
        {done && (
          <span className="text-xs font-semibold text-green-600">
            Review posted ✓
          </span>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-200 p-4">
      <h3 className="text-sm font-bold uppercase text-gray-500">
        Rate this student
      </h3>

      <div className="mt-2 flex items-center gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className={`transition ${
              n <= (hover || rating) ? "text-amber-500" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm font-semibold">{rating}/5</span>
      </div>

      <textarea
        rows={3}
        maxLength={1000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was the meetup? Friendly, on time, item as described…"
        className={`${inputCls} mt-3`}
      />

      {error && (
        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:border-black disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-full bg-[#ff2300] py-2 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
        >
          {busy ? "Posting…" : "Post review"}
        </button>
      </div>
    </form>
  );
}
