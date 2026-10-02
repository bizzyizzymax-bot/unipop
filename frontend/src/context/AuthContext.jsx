import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authApi,
  clearSession,
  getStoredUser,
  savedApi,
  setSession,
} from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [savedIds, setSavedIds] = useState([]);

  const refreshSaved = useCallback(async () => {
    if (!getStoredUser()) {
      setSavedIds([]);
      return;
    }
    try {
      const items = await savedApi.list();
      setSavedIds(items.map((p) => p.id));
    } catch {
      setSavedIds([]);
    }
  }, []);

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login(email, password);
      setSession(data);
      setUser(data);
      refreshSaved();
      return data;
    },
    [refreshSaved]
  );

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    setSession(data);
    setUser(data);
    setSavedIds([]);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setSavedIds([]);
  }, []);

  /** Heart / unheart a listing. Returns the new saved state. */
  const toggleSaved = useCallback(
    async (productId) => {
      const isSaved = savedIds.includes(productId);
      if (isSaved) {
        await savedApi.unsave(productId);
        setSavedIds((ids) => ids.filter((id) => id !== productId));
        return false;
      }
      await savedApi.save(productId);
      setSavedIds((ids) =>
        ids.includes(productId) ? ids : [...ids, productId]
      );
      return true;
    },
    [savedIds]
  );

  const value = useMemo(
    () => ({
      user,
      setUser,
      login,
      register,
      logout,
      savedIds,
      toggleSaved,
      refreshSaved,
    }),
    [user, login, register, logout, savedIds, toggleSaved, refreshSaved]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
