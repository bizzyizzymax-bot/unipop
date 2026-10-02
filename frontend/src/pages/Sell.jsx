import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { productApi } from "../lib/api";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none";
const MAX_PHOTOS = 10;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB per photo keeps payloads reasonable

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Sell() {
  const navigate = useNavigate();
  const { id: editId } = useParams(); // present when editing an existing listing
  const [catalog, setCatalog] = useState({ categories: [] });
  const [existing, setExisting] = useState(null); // product being edited
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
    gender: "",
    size: "",
    condition: "GOOD",
  });
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    productApi
      .categories()
      .then(setCatalog)
      .catch(() => {});
  }, []);

  // Edit mode: preload the current listing into the form.
  useEffect(() => {
    if (!editId) return;
    productApi
      .get(editId)
      .then((p) => {
        if (!p.owner) {
          setError("You can only edit your own listings.");
          return;
        }
        setExisting(p);
        setForm({
          title: p.title || "",
          description: p.description || "",
          price: p.price ?? "",
          category: p.category || "",
          subcategory: p.subcategory || "",
          gender: p.gender || "",
          size: p.size || "",
          condition: p.condition || "GOOD",
        });
        setImages(p.images || []);
      })
      .catch((err) => setError(err.message));
  }, [editId]);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const activeCategory = catalog.categories.find(
    (c) => c.name === form.category
  );

  async function handleFiles(e) {
    setError("");
    const files = Array.from(e.target.files || []);
    const room = MAX_PHOTOS - images.length;
    if (files.length > room) {
      setError(`You can upload up to ${MAX_PHOTOS} photos.`);
    }
    const accepted = [];
    for (const file of files.slice(0, room)) {
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" is larger than 2MB, skipping it.`);
        continue;
      }
      const dataUrl = await readFileAsDataUrl(file);
      accepted.push(dataUrl);
    }
    if (accepted.length) setImages((imgs) => [...imgs, ...accepted]);
    e.target.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.category) return setError("Pick a category.");
    if (!form.condition) return setError("Pick a condition.");
    if (!form.price || Number(form.price) <= 0)
      return setError("Enter a valid price.");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
      subcategory: form.subcategory || null,
      gender: form.gender || null,
      size: form.size || null,
      condition: form.condition,
      images,
    };

    setLoading(true);
    try {
      if (editId) {
        if (!existing) return setError("Listing could not be loaded yet.");
        await productApi.update(editId, {
          ...payload,
          status: existing.status, // preserve ACTIVE / SOLD
        });
        navigate(`/listing/${editId}`);
      } else {
        const created = await productApi.create(payload);
        navigate(`/listing/${created.id}`);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-black">
        {editId ? "Edit listing" : "List an item"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {editId
          ? "Update the details of your listing. Buyers will see the changes right away."
          : "Photos and messages are how deals start — Unipop never handles payment. Buyers reach out and you meet in person on campus."}
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-2xl border border-gray-200 p-6"
      >
        {/* Photos */}
        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
            Photos ({images.length}/{MAX_PHOTOS})
          </label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((src, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    setImages(images.filter((_, idx) => idx !== i))
                  }
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs shadow"
                >
                  ✕
                </button>
              </div>
            ))}
            {images.length < MAX_PHOTOS && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-2xl text-gray-400 hover:border-black hover:text-black">
                ＋<span className="text-[10px] font-semibold">Add photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
            Title
          </label>
          <input
            required
            maxLength={120}
            placeholder="IKEA desk, barely used"
            value={form.title}
            onChange={update("title")}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
            Description
          </label>
          <textarea
            rows={4}
            maxLength={2000}
            placeholder="Size, pickup location, why you're selling…"
            value={form.description}
            onChange={update("description")}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
              Price ($)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.price}
              onChange={update("price")}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
              Condition
            </label>
            <select
              value={form.condition}
              onChange={update("condition")}
              className={inputCls}
            >
              <option value="NEW">New</option>
              <option value="GOOD">Good</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
            Category
          </label>
          <select
            required
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
                subcategory: "",
                gender: "",
                size: "",
              })
            }
            className={inputCls}
          >
            <option value="">Select a category…</option>
            {catalog.categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {activeCategory && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {activeCategory.subcategories?.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Type
                </label>
                <select
                  value={form.subcategory}
                  onChange={update("subcategory")}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {activeCategory.subcategories.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeCategory.genders?.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Department
                </label>
                <select
                  value={form.gender}
                  onChange={update("gender")}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {activeCategory.genders.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeCategory.sizes?.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                  Size
                </label>
                <select
                  value={form.size}
                  onChange={update("size")}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {activeCategory.sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {editId && (
            <button
              type="button"
              onClick={() => navigate(`/listing/${editId}`)}
              disabled={loading}
              className="rounded-full border border-gray-300 px-5 py-3 text-sm font-bold hover:border-black disabled:opacity-60"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || (editId && !existing)}
            className="flex-1 rounded-full bg-[#ff2300] py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {loading
              ? editId
                ? "Saving…"
                : "Posting…"
              : editId
              ? "Save changes"
              : "Post listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
