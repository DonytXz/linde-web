import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, isDemo, policiesConfigured, policyVersions } from "../api";
import type { Booking, SavedIntake } from "../api/types";
import {
  Alert,
  ErrorNotice,
  Icon,
  Loading,
  Modal,
  PageHeading,
  Status,
} from "../components/ui";
import { dateTime, idempotencyKey, money } from "../lib/format";
import { useResource, useTitle, useUi } from "../lib/hooks";

const LivePayment = lazy(() => import("./Payment"));
export default function AppointmentPage({
  payment = false,
}: {
  payment?: boolean;
}) {
  const { id = "" } = useParams();
  const { t, lang, path } = useUi();
  const navigate = useNavigate();
  const location = useLocation();
  const resource = useResource(`booking:${id}`, () => api.booking(id));
  const booking = resource.data;
  const topics = useResource(`booking-topics:${id}`, () => api.topics());
  const lawyer = useResource(
    `booking-lawyer:${booking?.lawyerId}`,
    () => api.lawyer(booking!.lawyerId),
    Boolean(booking),
  );
  const intake = useResource(`booking-intake:${id}`, () => api.intake(id));
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [checkingPayment, setCheckingPayment] = useState(false);
  useTitle(t("appointmentTitle"));
  useEffect(() => {
    if (
      !booking ||
      booking.status !== "pendingPayment" ||
      !(checkingPayment || booking.paymentStatus === "processing")
    )
      return;
    const interval = setInterval(resource.reload, 4000);
    return () => clearInterval(interval);
  }, [
    booking?.status,
    booking?.paymentStatus,
    checkingPayment,
    resource.reload,
    booking,
  ]);
  async function cancel() {
    setBusy(true);
    setError(undefined);
    try {
      await api.cancel(id, idempotencyKey(`cancel:${id}`));
      setCancelOpen(false);
      resource.reload();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  async function demoPay() {
    setBusy(true);
    setError(undefined);
    try {
      await api.simulatePayment?.(id);
      resource.reload();
      navigate(
        path(
          "appointment",
          `${id}/${lang === "es" ? "confirmacion" : "confirmation"}`,
        ),
        { replace: true },
      );
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  if (!booking && resource.loading)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (resource.error || !booking)
    return (
      <div className="container page">
        <ErrorNotice error={resource.error} retry={resource.reload} />
        <Link className="text-link" to={path("appointments")}>
          {t("account")}
        </Link>
      </div>
    );
  const title =
    topics.data?.find((topic) => topic.id === booking.topicId)?.name[lang] ||
    t("appointmentTitle");
  const mayPay =
    booking.status === "pendingPayment" &&
    booking.paymentStatus !== "succeeded" &&
    (!booking.holdExpiresAt || Date.parse(booking.holdExpiresAt) > Date.now());
  const active = ["pendingPayment", "confirmed"].includes(booking.status);
  return (
    <div className="container page appointment-page">
      {location.state?.intakeFailed && !intake.data && (
        <Alert kind="error">{t("noteSaveFailed")}</Alert>
      )}
      <Link className="text-link back-link" to={path("appointments")}>
        <Icon name="arrow" className="rotate" size={16} />
        {t("account")}
      </Link>
      <PageHeading eyebrow={t("dashboardEyebrow")} title={title} />
      <div className="appointment-meta">
        <Status booking={booking} />
        <span>
          {t("reference")}: {booking.id}
        </span>
      </div>
      {Boolean(error) && !cancelOpen && (
        <ErrorNotice error={error} retry={resource.reload} />
      )}
      {booking.status === "confirmed" && (
        <div className="confirmed-banner">
          <Icon name="check" size={30} />
          <h2>{t("confirmedTitle")}</h2>
          <p>{t("confirmedBody")}</p>
        </div>
      )}
      {booking.status === "expired" && (
        <Alert>
          {t("expired")}{" "}
          <Link className="text-link" to={path("book")}>
            {t("book")}
          </Link>
        </Alert>
      )}
      {booking.resolutionRequired && (
        <Alert kind="error">{t("resolution")}</Alert>
      )}
      {booking.refundStatus === "pending" && (
        <Alert>{t("refundPending")}</Alert>
      )}
      <div className="detail-grid">
        <div className="appointment-main">
          <dl className="appointment-info-panel">
            <div>
              <dt>{t("schedule")}</dt>
              <dd>
                {dateTime(booking.startAt, booking.timeZone, lang)}
                <br />
                {booking.timeZone}
              </dd>
            </div>
            <div>
              <dt>{t("duration")}</dt>
              <dd>
                {Math.round(
                  (Date.parse(booking.endAt) - Date.parse(booking.startAt)) /
                    60000,
                )}{" "}
                {t("minutes")}
              </dd>
            </div>
            <div>
              <dt>{t("mode")}</dt>
              <dd>{t(booking.consultationMode)}</dd>
            </div>
            <div>
              <dt>{t("language")}</dt>
              <dd>{booking.language === "es" ? "Español" : "English"}</dd>
            </div>
            {lawyer.data && (
              <div>
                <dt>{t("lawyer")}</dt>
                <dd>{lawyer.data.displayName}</dd>
              </div>
            )}
          </dl>
          {Boolean(lawyer.error) && (
            <ErrorNotice error={lawyer.error} retry={lawyer.reload} />
          )}
          {booking.status === "pendingPayment" && booking.holdExpiresAt && (
            <HoldTimer
              expiresAt={booking.holdExpiresAt}
              onExpired={resource.reload}
            />
          )}
          {mayPay &&
            payment &&
            (isDemo ? (
              <div className="payment-panel">
                <h3>{t("payTitle")}</h3>
                <p className="fine-print">{t("demoPaymentNote")}</p>
                <button
                  className="button full"
                  style={{ marginTop: 20 }}
                  disabled={busy}
                  onClick={demoPay}
                >
                  {t(busy ? "loading" : "demoPayment")}
                  <Icon name="check" size={18} />
                </button>
              </div>
            ) : (
              <Suspense fallback={<Loading />}>
                <LivePayment
                  booking={booking}
                  onSubmitted={() => {
                    setCheckingPayment(true);
                    resource.reload();
                  }}
                />
              </Suspense>
            ))}
          {booking.status === "pendingPayment" &&
            (checkingPayment || booking.paymentStatus === "processing") && (
              <Alert>
                {t("processing")}
                <br />
                <button className="text-link" onClick={resource.reload}>
                  {t("checkStatus")}
                </button>
              </Alert>
            )}
          {active &&
            (intake.loading ? (
              <Loading />
            ) : intake.error ? (
              <ErrorNotice error={intake.error} retry={intake.reload} />
            ) : (
              <IntakeEditor
                key={`${id}:${intake.data?.updatedAt || ""}`}
                booking={booking}
                saved={intake.data || null}
                onSaved={() => {
                  intake.reload();
                  resource.reload();
                }}
              />
            ))}
          {active && (
            <button className="cancel-link" onClick={() => setCancelOpen(true)}>
              {t("cancel")}
            </button>
          )}
        </div>
        <aside className="summary-panel">
          <p className="eyebrow">{t("payment")}</p>
          <h3>{t("price")}</h3>
          <div className="summary-row">
            <span>{t("price")}</span>
            <strong>
              {money(booking.quote.subtotal, booking.quote.currency, lang)}
            </strong>
          </div>
          <div className="summary-row">
            <span>{t("tax")}</span>
            <strong>
              {money(booking.quote.tax, booking.quote.currency, lang)}
            </strong>
          </div>
          <div className="summary-row">
            <span>{t("total")}</span>
            <strong>
              {money(booking.quote.total, booking.quote.currency, lang)}
            </strong>
          </div>
          {booking.paymentStatus === "succeeded" && (
            <Alert kind="success">{t("receipt")}</Alert>
          )}
          {mayPay && !payment && (
            <Link
              className="button full"
              to={path(
                "appointment",
                `${id}/${lang === "es" ? "pago" : "payment"}`,
              )}
            >
              {t("pay")}
              <Icon name="arrow" size={17} />
            </Link>
          )}
          <p className="fine-print">{t("reservationNote")}</p>
          <Link
            className="text-link"
            style={{ marginTop: 16 }}
            to={path("cancellation")}
          >
            {t("cancellation")}
          </Link>
        </aside>
      </div>
      {cancelOpen && (
        <Modal
          title={t("cancelTitle")}
          close={() => {
            if (!busy) setCancelOpen(false);
          }}
        >
          <p>{t("cancelBody")}</p>
          {Boolean(error) && <ErrorNotice error={error} />}
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setCancelOpen(false)}
            >
              {t("keepBooking")}
            </button>
            <button className="button danger" disabled={busy} onClick={cancel}>
              {t(busy ? "loading" : "confirmCancel")}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function HoldTimer({
  expiresAt,
  onExpired,
}: {
  expiresAt: string;
  onExpired: () => void;
}) {
  const { t } = useUi();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000)),
  );
  useEffect(() => {
    const update = () =>
      setRemaining(
        Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000)),
      );
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  useEffect(() => {
    if (remaining === 0) onExpired();
  }, [remaining, onExpired]);
  return (
    <div className="hold-timer">
      <span>{t("hold")}</span>
      <strong>
        {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
      </strong>
    </div>
  );
}
function IntakeEditor({
  booking,
  saved,
  onSaved,
}: {
  booking: Booking;
  saved: SavedIntake;
  onSaved: () => void;
}) {
  const { t, path } = useUi();
  const [summary, setSummary] = useState(saved?.summary || "");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [success, setSuccess] = useState(false);
  const currentConsent =
    saved?.consents.privacyNoticeVersion ===
      policyVersions.privacyNoticeVersion &&
    saved?.consents.termsVersion === policyVersions.termsVersion;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await api.saveIntake(booking.id, {
        summary: summary.trim() || undefined,
        preferredLanguage: booking.language,
        consents: policyVersions,
      });
      setSuccess(true);
      onSaved();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="intake-editor" onSubmit={submit}>
      <h3>{t("intakeTitle")}</h3>
      <label>
        {t("note")}
        <small>
          {t("optional")} · {t("noteHelp")}
        </small>
        <textarea
          rows={4}
          maxLength={2000}
          value={summary}
          onChange={(event) => {
            setSummary(event.target.value);
            setSuccess(false);
          }}
        />
      </label>
      {!currentConsent && (
        <>
          <label className="checkbox-label">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            {t("accept")}
          </label>
          <div className="policy-links">
            <Link to={path("privacy")}>{t("privacy")}</Link>
            <Link to={path("terms")}>{t("terms")}</Link>
          </div>
        </>
      )}
      {Boolean(error) && <ErrorNotice error={error} />}
      {success && <Alert kind="success">{t("saved")}</Alert>}
      <button
        className="button secondary"
        disabled={busy || !policiesConfigured || (!currentConsent && !consent)}
      >
        {t(busy ? "loading" : "saveNote")}
        <Icon name="check" size={17} />
      </button>
    </form>
  );
}
