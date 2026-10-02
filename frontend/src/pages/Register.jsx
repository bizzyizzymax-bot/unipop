import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ageFrom(dob) {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    username: "",
    email: "",
    password: "",
    dob: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const email = form.email.trim().toLowerCase();
    if (!email.endsWith(".edu")) {
      setError("You must sign up with a university email ending in .edu");
      return;
    }
    if (!form.dob) {
      setError("Date of birth is required.");
      return;
    }
    if (ageFrom(form.dob) < 18) {
      setError("You must be at least 18 years old to use Unipop.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        username: form.username.trim(),
        email,
        password: form.password,
        dob: form.dob,
      });
      navigate("/browse", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none";

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-black">Join your campus</h1>
        <p className="mt-1 text-sm text-gray-500">
          Unipop is for university students only — buy and sell dorm furniture,
          textbooks and leases with people at your school. You must be 18 or
          older.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                First name
              </label>
              <input
                required
                value={form.firstName}
                onChange={update("firstName")}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Username
              </label>
              <input
                required
                minLength={3}
                maxLength={30}
                value={form.username}
                onChange={update("username")}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
              University email (.edu only)
            </label>
            <input
              type="email"
              required
              placeholder="you@charlotte.edu"
              value={form.email}
              onChange={update("email")}
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Your email decides your campus: @charlotte.edu students only see
              @charlotte.edu listings.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
              Date of birth (18+)
            </label>
            <input
              type="date"
              required
              value={form.dob}
              onChange={update("dob")}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={form.password}
              onChange={update("password")}
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#ff2300] py-2.5 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-black underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
