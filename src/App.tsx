import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthGate, AuthProvider } from "./lib/hooks";
import { route } from "./lib/routes";
import Layout from "./components/Layout";
import { Loading } from "./components/ui";
import Home from "./pages/Home";

const Catalogue = lazy(() => import("./pages/Catalogue"));
const Auth = lazy(() => import("./pages/Auth"));
const Booking = lazy(() => import("./pages/Booking"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Appointment = lazy(() => import("./pages/Appointment"));
const Information = lazy(() => import("./pages/Information"));

function Legacy({
  page,
}: {
  page: "home" | "book" | "login" | "register" | "appointments" | "services";
}) {
  const location = useLocation();
  return <Navigate replace to={route("es", page) + location.search} />;
}
export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate replace to="/es" />} />
            {(["es", "en"] as const).map((lang) => (
              <Route key={lang}>
                <Route path={route(lang, "home")} element={<Home />} />
                <Route path={route(lang, "services")} element={<Catalogue />} />
                <Route
                  path={`${route(lang, "services")}/:slug`}
                  element={<Catalogue />}
                />
                {(
                  ["login", "register", "forgot", "reset", "verify"] as const
                ).map((kind) => (
                  <Route
                    key={kind}
                    path={route(lang, kind)}
                    element={<Auth key={kind} kind={kind} />}
                  />
                ))}
                <Route
                  path={route(lang, "book")}
                  element={
                    <AuthGate>
                      <Booking />
                    </AuthGate>
                  }
                />
                <Route
                  path={route(lang, "appointments")}
                  element={
                    <AuthGate>
                      <Dashboard />
                    </AuthGate>
                  }
                />
                <Route
                  path={`${route(lang, "appointment")}/:id`}
                  element={
                    <AuthGate>
                      <Appointment />
                    </AuthGate>
                  }
                />
                <Route
                  path={`${route(lang, "appointment")}/:id/${lang === "es" ? "pago" : "payment"}`}
                  element={
                    <AuthGate>
                      <Appointment payment />
                    </AuthGate>
                  }
                />
                <Route
                  path={`${route(lang, "appointment")}/:id/${lang === "es" ? "confirmacion" : "confirmation"}`}
                  element={
                    <AuthGate>
                      <Appointment />
                    </AuthGate>
                  }
                />
                {(["privacy", "terms", "cancellation", "contact"] as const).map(
                  (kind) => (
                    <Route
                      key={kind}
                      path={route(lang, kind)}
                      element={<Information kind={kind} />}
                    />
                  ),
                )}
                {(["team", "admin"] as const).map((kind) => (
                  <Route
                    key={kind}
                    path={route(lang, kind)}
                    element={
                      <AuthGate staff>
                        <Information kind="team" />
                      </AuthGate>
                    }
                  />
                ))}
              </Route>
            ))}
            <Route path="/login" element={<Legacy page="login" />} />
            <Route path="/register" element={<Legacy page="register" />} />
            <Route path="/booking" element={<Legacy page="book" />} />
            <Route path="/dashboard" element={<Legacy page="appointments" />} />
            {["/payment", "/confirmation", "/details"].map((path) => (
              <Route
                key={path}
                path={path}
                element={<Legacy page="appointments" />}
              />
            ))}
            <Route path="/topics/:id" element={<Legacy page="services" />} />
            <Route path="*" element={<Information kind="notFound" />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
