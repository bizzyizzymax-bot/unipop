import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors hover:text-black ${
    isActive ? "text-black" : "text-gray-500"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          to={user ? "/browse" : "/login"}
          className="flex items-center gap-1"
        >
          <span className="text-2xl font-bold tracking-tight text-[#000000]">
            uni
            <span className="text-2xl font-bold tracking-tight text-[#ff2705]">
              pop
            </span>
          </span>
        </Link>

        {user && (
          <nav className="ml-4 hidden items-center gap-5 sm:flex">
            <NavLink to="/browse" className={linkClass}>
              Browse
            </NavLink>
            <NavLink to="/sell" className={linkClass}>
              Sell
            </NavLink>
            <NavLink to="/saved" className={linkClass}>
              Saved
            </NavLink>
            <NavLink to="/inbox" className={linkClass}>
              Inbox
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 sm:inline">
                @{user.username} · {user.schoolDomain}
              </span>
              <Link
                to="/sell"
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                + Sell
              </Link>
              <button
                onClick={logout}
                className="text-sm font-medium text-gray-500 hover:text-black"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-black"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {user && (
        <nav className="flex justify-around border-t border-gray-100 py-2 sm:hidden">
          <NavLink to="/browse" className={linkClass}>
            Browse
          </NavLink>
          <NavLink to="/sell" className={linkClass}>
            Sell
          </NavLink>
          <NavLink to="/saved" className={linkClass}>
            Saved
          </NavLink>
          <NavLink to="/inbox" className={linkClass}>
            Inbox
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>
        </nav>
      )}
    </header>
  );
}
