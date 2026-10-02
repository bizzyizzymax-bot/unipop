import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ReviewList from "../components/ReviewList";
import { useAuth } from "../context/AuthContext";
import { productApi, userApi } from "../lib/api";

const LOCK_DAYS = 14;
const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none";

/** Returns { locked, until } for a 14-day change lock. */
function lockStatus(lastChange) {
  if (!lastChange || lastChange === "null" || lastChange === "undefined") {
    return { locked: false, until: null };
  }
  const last = new Date(lastChange);
  if (Number.isNaN(last.getTime())) return { locked: false, until: null };
  const until = new Date(last.getTime() + LOCK_DAYS * 24 * 60 * 60 * 1000);
  return { locked: until.getTime() > Date.now(), until };
}

const fmt = (d) =>
  d
    ? d.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    username: "",
    email: "",
  });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    userApi
      .get(user.id)
      .then((p) => {
        setProfile(p);
        setForm({
          firstName: p.firstName,
          username: p.username,
          email: p.email,
        });
      })
      .catch(() => {});
    productApi
      .list({ sellerId: user.id })
      .then(setListings)
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  const emailLock = lockStatus(profile?.lastEmailUsernameChange);
  const pwdLock = lockStatus(profile?.lastPasswordChange);

  async function saveProfile(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setBusy(true);
    try {
      const updated = await userApi.update(user.id, {
        firstName: form.firstName,
        username: form.username,
        email: form.email,
      });
      setProfile(updated);
      const next = {
        ...user,
        firstName: updated.firstName,
        username: updated.username,
        email: updated.email,
        schoolDomain: updated.schoolDomain,
        lastEmailUsernameChange: updated.lastEmailUsernameChange,
      };
      localStorage.setItem("unipop_user", JSON.stringify(next));
      setUser(next);
      setMsg({
        type: "ok",
        text: "Saved. Username/email can be changed again in 14 days.",
      });
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setBusy(true);
    try {
      await userApi.updatePassword(
        user.id,
        pwd.currentPassword,
        pwd.newPassword
      );
      const refreshed = await userApi.get(user.id);
      setProfile(refreshed);
      setPwd({ currentPassword: "", newPassword: "" });
      setMsg({ type: "ok", text: "Password updated. Next change in 14 days." });
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount(e) {
    e.preventDefault();
    if (confirmText !== "DELETE") {
      setMsg({ type: "err", text: "Type DELETE exactly to confirm." });
      return;
    }
    setDeleting(true);
    try {
      await userApi.remove(user.id); // backend wipes listings, messages, reviews
      logout();
      navigate("/login");
    } catch (err) {
      setMsg({ type: "err", text: err.message });
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff2300] text-2xl font-black text-white">
          {user.firstName?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <h1 className="text-xl font-black">{user.firstName}</h1>
          <p className="text-sm text-gray-500">
            @{user.username} · {user.email}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2 text-right">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold">
            🎓 {profile?.schoolDomain}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold">
            ID #{user.id} · permanent
          </span>
        </div>
      </div>

      {msg.text && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.type === "ok"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Username / email / name */}
        <form
          onSubmit={saveProfile}
          className="rounded-2xl border border-gray-200 p-5"
        >
          <h2 className="font-black">Account details</h2>
          <p className="mb-4 text-xs text-gray-500">
            Your userID is fixed forever. Username and email can only be edited
            once every {LOCK_DAYS} days.
            {emailLock.locked && (
              <>
                {" "}
                <span className="font-semibold text-amber-600">
                  Locked until {fmt(emailLock.until)}.
                </span>
              </>
            )}
          </p>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                First name
              </label>
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Username
              </label>
              <input
                value={form.username}
                disabled={emailLock.locked}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Email (.edu)
              </label>
              <input
                type="email"
                value={form.email}
                disabled={emailLock.locked}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || emailLock.locked}
            className="mt-4 w-full rounded-full bg-black py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {emailLock.locked
              ? `Locked until ${fmt(emailLock.until)}`
              : "Save changes"}
          </button>
        </form>

        {/* Password */}
        <form
          onSubmit={savePassword}
          className="rounded-2xl border border-gray-200 p-5"
        >
          <h2 className="font-black">Password</h2>
          <p className="mb-4 text-xs text-gray-500">
            Passwords can also only be changed once every {LOCK_DAYS} days.
            {pwdLock.locked && (
              <>
                {" "}
                <span className="font-semibold text-amber-600">
                  Locked until {fmt(pwdLock.until)}.
                </span>
              </>
            )}
          </p>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Current password
              </label>
              <input
                type="password"
                required
                disabled={pwdLock.locked}
                value={pwd.currentPassword}
                onChange={(e) =>
                  setPwd({ ...pwd, currentPassword: e.target.value })
                }
                className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                New password (8+ chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                disabled={pwdLock.locked}
                value={pwd.newPassword}
                onChange={(e) =>
                  setPwd({ ...pwd, newPassword: e.target.value })
                }
                className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || pwdLock.locked}
            className="mt-4 w-full rounded-full bg-black py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {pwdLock.locked
              ? `Locked until ${fmt(pwdLock.until)}`
              : "Change password"}
          </button>
        </form>
      </div>

      {/* Danger zone - delete account */}
      <div className="rounded-2xl border border-red-200 p-5">
        <h2 className="font-black text-red-600">Delete account</h2>
        <p className="mb-3 text-xs text-gray-500">
          This permanently removes your account together with your listings,
          messages and reviews. It cannot be undone.
        </p>
        {!confirmOpen ? (
          <button
            onClick={() => {
              setConfirmOpen(true);
              setConfirmText("");
              setMsg({ type: "", text: "" });
            }}
            className="rounded-full border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
          >
            Delete my account
          </button>
        ) : (
          <form
            onSubmit={deleteAccount}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className={`${inputCls} sm:max-w-xs`}
            />
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:border-black disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleting || confirmText !== "DELETE"}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Permanently delete"}
            </button>
          </form>
        )}
      </div>

      {/* My listings */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black">
            My listings ({listings.length})
          </h2>
          <button
            onClick={logout}
            className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Log out
          </button>
        </div>
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            You haven't posted anything yet — hit “+ Sell” to list your first
            item.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {listings.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Reviews other students left about you */}
      <div>
        <ReviewList userId={user.id} heading="Reviews about you" />
      </div>
    </div>
  );
}
