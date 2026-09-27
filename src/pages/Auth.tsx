import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, isDemo, policiesConfigured, policyVersions } from "../api";
import { Alert, ErrorNotice, Icon } from "../components/ui";
import { useAuth, useTitle, useUi } from "../lib/hooks";
import { browserZone, safeReturnPath } from "../lib/format";
import type { CopyKey } from "../content";

type Kind = "login" | "register" | "forgot" | "reset" | "verify";
export default function AuthPage({ kind }: { kind: Kind }) {
  const { t, lang, path } = useUi();
  const auth = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>();
  const [success, setSuccess] = useState<CopyKey>();
  const [busy, setBusy] = useState(false);
  const title = `${kind}Title` as CopyKey;
  useTitle(t(title));
  const token = params.get("token") || "";
  const returnTo = safeReturnPath(params.get("returnTo"), path("appointments"));
  const authLink = (page: "login" | "register") =>
    `${path(page)}?returnTo=${encodeURIComponent(returnTo)}`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") || "");
    const password = String(values.get("password") || "");
    try {
      if (kind === "login") {
        await auth.signIn(email, password);
        navigate(returnTo, { replace: true });
        return;
      }
      if (kind === "register") {
        await api.register({
          email,
          password,
          givenName: String(values.get("givenName")),
          familyName: String(values.get("familyName")),
          preferredLanguage: lang,
          timeZone: browserZone(),
          consents: policyVersions,
        });
        setSuccess("registerDone");
      }
      if (kind === "forgot") {
        await api.forgot(email);
        setSuccess("emailSent");
      }
      if (kind === "reset") {
        await api.reset(token, password);
        setSuccess("resetDone");
        navigate(path("reset"), { replace: true });
      }
      if (kind === "verify") {
        if (token) {
          await api.verify(token);
          setSuccess("verified");
          navigate(path("verify"), { replace: true });
        } else {
          await api.resend(email);
          setSuccess("emailSent");
        }
      }
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  async function demoLogin() {
    setBusy(true);
    try {
      await auth.signIn("alex@example.test", "demo-not-a-password");
      navigate(returnTo, { replace: true });
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout container">
      <aside className="auth-aside">
        <p className="eyebrow">{t("tagline")}</p>
        <h2>
          {t("heroTitle")}
          <br />
          <em>{t("heroEmphasis")}</em>
        </h2>
        <img src="/brand/pathway.svg" alt="" width="600" height="650" />
        <p>{t("heroNote")}</p>
      </aside>
      <section className="auth-form-wrap" key={kind}>
        <p className="eyebrow">
          LINDE /{" "}
          {t(
            kind === "login"
              ? "login"
              : kind === "register"
                ? "register"
                : "account",
          )}
        </p>
        <h1>{t(title)}</h1>
        {!["reset", "verify"].includes(kind) && (
          <p className="form-intro">{t(`${kind}Body` as CopyKey)}</p>
        )}
        {Boolean(error) && <ErrorNotice error={error} />}
        {success ? (
          <>
            <Alert kind="success">{t(success)}</Alert>
            <Link className="button full" to={authLink("login")}>
              {t("login")}
              <Icon name="arrow" />
            </Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <fieldset disabled={busy}>
              {kind === "register" && (
                <div className="form-row">
                  <label>
                    {t("givenName")}
                    <input
                      name="givenName"
                      autoComplete="given-name"
                      required
                      maxLength={100}
                    />
                  </label>
                  <label>
                    {t("familyName")}
                    <input
                      name="familyName"
                      autoComplete="family-name"
                      required
                      maxLength={100}
                    />
                  </label>
                </div>
              )}
              {["login", "register", "forgot"].includes(kind) ||
              (kind === "verify" && !token) ? (
                <label>
                  {t("email")}
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                  />
                </label>
              ) : null}
              {["login", "register", "reset"].includes(kind) && (
                <label>
                  {t(kind === "reset" ? "newPassword" : "password")}
                  <input
                    name="password"
                    type="password"
                    autoComplete={
                      kind === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={kind === "login" ? 1 : 12}
                    maxLength={128}
                  />
                  {kind !== "login" && <small>{t("passwordHint")}</small>}
                </label>
              )}
              {kind === "login" && (
                <Link className="text-link forgot-link" to={path("forgot")}>
                  {t("forgot")}
                </Link>
              )}
              {kind === "register" && (
                <>
                  <label className="checkbox-label">
                    <input type="checkbox" required />
                    {t("accept")}
                  </label>
                  <div className="policy-links">
                    <Link to={path("privacy")} target="_blank" rel="noopener">
                      {t("privacy")}
                    </Link>
                    <Link to={path("terms")} target="_blank" rel="noopener">
                      {t("terms")}
                    </Link>
                  </div>
                  {!policiesConfigured && <Alert>{t("policyPending")}</Alert>}
                </>
              )}
              {kind === "reset" && !token && <Alert>{t("missingToken")}</Alert>}
              <button
                className="button full"
                disabled={
                  busy ||
                  (kind === "register" && !policiesConfigured) ||
                  (kind === "reset" && !token)
                }
              >
                {busy
                  ? t("loading")
                  : t(
                      kind === "forgot"
                        ? "sendLink"
                        : kind === "verify" && !token
                          ? "resend"
                          : kind,
                    )}
                <Icon name="arrow" size={18} />
              </button>
            </fieldset>
          </form>
        )}
        {kind === "login" && (
          <>
            <p className="auth-switch">
              {t("noAccount")}{" "}
              <Link to={authLink("register")}>{t("register")}</Link>
            </p>
            {isDemo && (
              <button
                className="button secondary full demo-login"
                disabled={busy}
                onClick={demoLogin}
              >
                {t("demoLogin")}
                <Icon name="arrow" size={18} />
              </button>
            )}
          </>
        )}
        {kind === "register" && (
          <p className="auth-switch">
            {t("haveAccount")} <Link to={authLink("login")}>{t("login")}</Link>
          </p>
        )}
        {kind === "login" && (
          <Link className="quiet-link" to={path("verify")}>
            {t("resend")}
          </Link>
        )}
      </section>
    </div>
  );
}
