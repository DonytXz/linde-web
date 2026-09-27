import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { isDemo } from "../api";
import { useAuth, useUi } from "../lib/hooks";
import { swapLanguage } from "../lib/routes";
import { ErrorNotice, Icon, Logo } from "./ui";

export default function Layout() {
  const { lang, t, path } = useUi();
  const { user, signOut } = useAuth();
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState<unknown>();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    document.documentElement.lang = lang;
    setMenu(false);
    if (!location.hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.hash, lang]);
  async function logout() {
    try {
      await signOut();
      navigate(path("home"));
    } catch (failure) {
      setError(failure);
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      {isDemo && <div className="demo-banner">{t("demo")}</div>}
      <header className="site-header">
        <div className="header-inner">
          <Link to={path("home")} aria-label="Linde — Home">
            <Logo />
          </Link>
          <nav
            aria-label={lang === "es" ? "Principal" : "Main"}
            className="desktop-nav"
          >
            <Link to={path("services")}>{t("services")}</Link>
            <Link to={`${path("home")}#approach`}>{t("approach")}</Link>
            <Link to={`${path("home")}#how-it-works`}>{t("how")}</Link>
          </nav>
          <div className="header-actions">
            <Link
              className="language-switch"
              to={
                swapLanguage(location.pathname, lang === "es" ? "en" : "es") +
                location.search +
                location.hash
              }
              aria-label={
                lang === "es" ? "Switch to English" : "Cambiar a español"
              }
            >
              <Icon name="globe" size={17} />
              {lang === "es" ? "EN" : "ES"}
            </Link>
            <Link
              className="header-account"
              to={path(user ? "appointments" : "login")}
            >
              {t(user ? "account" : "login")}
            </Link>
            <Link className="button small header-book" to={path("book")}>
              {t("book")}
              <Icon name="arrow" size={16} />
            </Link>
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-controls="mobile-nav"
              aria-label={t(menu ? "close" : "menu")}
            >
              <Icon name={menu ? "close" : "menu"} />
            </button>
          </div>
        </div>
        {menu && (
          <nav
            className="mobile-nav"
            id="mobile-nav"
            aria-label={
              lang === "es" ? "Navegación móvil" : "Mobile navigation"
            }
          >
            <Link to={path("services")}>{t("services")}</Link>
            <Link
              to={`${path("home")}#approach`}
              onClick={() => setMenu(false)}
            >
              {t("approach")}
            </Link>
            <Link to={path(user ? "appointments" : "login")}>
              {t(user ? "account" : "login")}
            </Link>
            <Link className="button" to={path("book")}>
              {t("book")}
              <Icon name="arrow" />
            </Link>
          </nav>
        )}
      </header>
      {Boolean(error) && (
        <div className="container">
          <ErrorNotice error={error} />
        </div>
      )}
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-main">
            <div>
              <Link to={path("home")} aria-label="Linde — Home">
                <Logo inverse />
              </Link>
              <p className="footer-tagline">{t("footerBody")}</p>
              <p className="footer-note">{t("footerNote")}</p>
            </div>
            <div className="footer-links">
              <Link to={path("services")}>{t("services")}</Link>
              <Link to={path("book")}>{t("book")}</Link>
              <Link to={path("contact")}>{t("contact")}</Link>
              {user && <button onClick={logout}>{t("logout")}</button>}
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {t("rights")}
            </span>
            <nav
              aria-label={
                lang === "es" ? "Información legal" : "Legal information"
              }
            >
              <Link to={path("privacy")}>{t("privacy")}</Link>
              <Link to={path("terms")}>{t("terms")}</Link>
              <Link to={path("cancellation")}>{t("cancellation")}</Link>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
