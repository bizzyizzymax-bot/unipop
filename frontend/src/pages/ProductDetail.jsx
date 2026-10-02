import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConditionBadge } from "../components/ProductCard";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import { useAuth } from "../context/AuthContext";
import { conversationApi, productApi } from "../lib/api";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, savedIds, toggleSaved } = useAuth();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const [messaging, setMessaging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewTick, setReviewTick] = useState(0); // bump to reload reviews

  useEffect(() => {
    productApi
      .get(id)
      .then((p) => {
        setProduct(p);
        setActive(0);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        {error}
      </div>
    );
  }
  if (!product) {
    return <div className="animate-pulse rounded-2xl bg-gray-100 p-40" />;
  }

  const isSaved = savedIds.includes(product.id);
  const isOwner = product.owner;

  async function messageSeller() {
    setMessaging(true);
    setError("");
    try {
      const convo = await conversationApi.start(product.seller.id, product.id);
      navigate(`/inbox?c=${convo.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setMessaging(false);
    }
  }

  async function toggleSold() {
    setBusy(true);
    try {
      const updated = await productApi.update(product.id, {
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        subcategory: product.subcategory,
        gender: product.gender,
        size: product.size,
        condition: product.condition,
        status: product.status === "SOLD" ? "ACTIVE" : "SOLD",
        images: product.images,
      });
      setProduct(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeListing() {
    if (!window.confirm("Delete this listing permanently?")) return;
    setBusy(true);
    try {
      await productApi.remove(product.id);
      navigate("/browse");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const images = product.images?.length ? product.images : [null];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
          {images[active] ? (
            <img
              src={images[active]}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl text-gray-300">
              📦
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                  active === i ? "border-black" : "border-transparent"
                }`}
              >
                {src ? (
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    📦
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ConditionBadge condition={product.condition} />
              {product.status === "SOLD" && (
                <span className="rounded-full bg-black px-2 py-0.5 text-[11px] font-bold text-white">
                  SOLD
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-black">{product.title}</h1>
            <p className="mt-1 text-3xl font-black text-[#ff2300]">
              ${product.price?.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => toggleSaved(product.id)}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:border-black"
          >
            {isSaved ? "❤️ Saved" : "🤍 Save"}
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 p-3">
            <dt className="text-xs uppercase text-gray-500">Category</dt>
            <dd className="font-semibold">
              {product.category}
              {product.subcategory ? ` · ${product.subcategory}` : ""}
            </dd>
          </div>
          {product.gender && (
            <div className="rounded-xl bg-gray-50 p-3">
              <dt className="text-xs uppercase text-gray-500">Department</dt>
              <dd className="font-semibold">{product.gender}</dd>
            </div>
          )}
          {product.size && (
            <div className="rounded-xl bg-gray-50 p-3">
              <dt className="text-xs uppercase text-gray-500">Size</dt>
              <dd className="font-semibold">{product.size}</dd>
            </div>
          )}
          <div className="rounded-xl bg-gray-50 p-3">
            <dt className="text-xs uppercase text-gray-500">Condition</dt>
            <dd className="font-semibold capitalize">
              {product.condition?.toLowerCase()}
            </dd>
          </div>
        </dl>

        {product.description && (
          <div className="mt-5">
            <h2 className="text-sm font-bold uppercase text-gray-500">
              Description
            </h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
              {product.description}
            </p>
          </div>
        )}

        {/* Seller */}
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-200 p-4">
          <div>
            <p className="font-semibold">{product.seller?.username}</p>
            <p className="text-xs text-gray-500">
              {product.seller?.firstName} · {product.sellerSchoolDomain}
            </p>
          </div>
          <span className="text-xs text-gray-400">Student seller</span>
        </div>

        {/* What other students said about this seller */}
        {!isOwner && product.seller?.id !== user?.id && (
          <div className="mt-6">
            <ReviewForm
              sellerId={product.seller.id}
              label="⭐ Write a review"
              refreshKey={reviewTick}
              onChanged={() => setReviewTick((t) => t + 1)}
            />
          </div>
        )}
        <ReviewList
          userId={product.seller?.id}
          heading="Seller reviews"
          refreshKey={reviewTick}
          onDeleted={() => setReviewTick((t) => t + 1)}
        />

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions - no in-app checkout, ever. */}
        {!isOwner ? (
          <div className="mt-5 space-y-3">
            <button
              onClick={messageSeller}
              disabled={messaging || product.status === "SOLD"}
              className="w-full rounded-full bg-[#ff2300] py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
            >
              {messaging ? "Opening chat…" : "💬 Message seller"}
            </button>
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-semibold text-black">Meet up to exchange 🤝</p>
              Unipop has no checkout — message the seller to agree on a price
              and a safe public spot on campus, then pay in person.
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/listing/${product.id}/edit`)}
              disabled={busy}
              className="flex-1 rounded-full bg-[#ff2300] py-3 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
            >
              ✏️ Edit listing
            </button>
            <button
              onClick={toggleSold}
              disabled={busy}
              className="flex-1 rounded-full bg-black py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {product.status === "SOLD" ? "Mark as available" : "Mark as sold"}
            </button>
            <button
              onClick={removeListing}
              disabled={busy}
              className="rounded-full border border-red-300 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
