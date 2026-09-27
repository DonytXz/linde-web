import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../api";
import { ApiError } from "../api/http";
import type { Language, User } from "../api/types";
import { copy, type CopyKey } from "../content";
import { route } from "./routes";

export function useUi() {
  const location = useLocation();
  const lang: Language = location.pathname.split("/")[1] === "en" ? "en" : "es";
  return {
    lang,
    t: (key: CopyKey) => copy[lang][key],
    path: (page: Parameters<typeof route>[1], suffix = "") =>
      route(lang, page, suffix),
  };
}
export function useResource<T>(
  key: string,
  loader: () => Promise<T>,
  enabled = true,
) {
  const [state, setState] = useState<{
    key: string;
    data?: T;
    error?: unknown;
    loading: boolean;
  }>({ key, loading: enabled });
  const [version, setVersion] = useState(0);
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setState((previous) => ({
      key,
      data: previous.key === key ? previous.data : undefined,
      loading: true,
    }));
    Promise.resolve()
      .then(() => loaderRef.current())
      .then((data) => {
        if (active) setState({ key, data, loading: false });
      })
      .catch((error) => {
        if (active) setState({ key, error, loading: false });
      });
    return () => {
      active = false;
    };
  }, [key, version, enabled]);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { ...(state.key === key ? state : { key, loading: enabled }), reload };
}
export function errorKey(error: unknown): CopyKey {
  if (!(error instanceof ApiError)) return "error";
  if (error.code === "NOT_CONFIGURED") return "unavailable";
  if (error.status === 401) return "unauthorized";
  if (error.status === 403) return "forbidden";
  if (error.status === 404) return "notFound";
  if (error.status === 409) return "conflict";
  if (error.status === 422 || error.status === 400) return "invalid";
  if (error.status === 503) return "network";
  return "error";
}
type Auth = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api
      .me()
      .then((value) => {
        if (active) setUser(value);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const signIn = useCallback(async (email: string, password: string) => {
    const session = await api.login(email, password);
    setUser(session.user);
  }, []);
  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);
  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider is required");
  return context;
}
export function AuthGate({
  children,
  staff = false,
}: {
  children: ReactNode;
  staff?: boolean;
}) {
  const { user, loading } = useAuth();
  const { t, path } = useUi();
  const location = useLocation();
  if (loading)
    return (
      <div className="loading-state" role="status">
        {t("loading")}
      </div>
    );
  if (!user)
    return (
      <Navigate
        replace
        to={`${path("login")}?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
      />
    );
  if (staff && !["lawyer", "admin"].includes(user.role))
    return <Navigate replace to={path("appointments")} />;
  return children;
}
export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — Linde`;
  }, [title]);
}
