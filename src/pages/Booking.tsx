import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, policiesConfigured, policyVersions } from "../api";
import { ApiError } from "../api/http";
import type { Language, Mode, Slot, Topic } from "../api/types";
import {
  Alert,
  ErrorNotice,
  Icon,
  Loading,
  PageHeading,
} from "../components/ui";
import { useResource, useTitle, useUi } from "../lib/hooks";
import {
  browserZone,
  dateTime,
  idempotencyKey,
  localDate,
  money,
} from "../lib/format";

export default function BookingPage() {
  const { t } = useUi();
  useTitle(t("book"));
  const resource = useResource("booking-catalogue", () => api.topics());
  return (
    <div className="container page">
      <PageHeading
        eyebrow={t("howEyebrow")}
        title={t("bookingTitle")}
        body={t("bookingBody")}
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorNotice error={resource.error} retry={resource.reload} />
      ) : resource.data?.length ? (
        <BookingForm topics={resource.data} />
      ) : (
        <Alert>{t("emptyServices")}</Alert>
      )}
    </div>
  );
}

function BookingForm({ topics }: { topics: Topic[] }) {
  const { t, lang, path } = useUi();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial =
    topics.find((item) => item.id === params.get("service")) || topics[0];
  const [topicId, setTopicId] = useState(initial.id);
  const topic = topics.find((item) => item.id === topicId) || initial;
  const [duration, setDuration] = useState(topic.durationMinutesOptions[0]);
  const [language, setLanguage] = useState<Language>(
    topic.languages.includes(lang) ? lang : topic.languages[0],
  );
  const [mode, setMode] = useState<Mode>(topic.consultationModes[0]);
  const [zone, setZone] = useState(browserZone);
  const [step, setStep] = useState(0);
  const [week, setWeek] = useState(0);
  const [anchor] = useState(Date.now);
  const [selected, setSelected] = useState<Slot>();
  const [day, setDay] = useState("");
  const [summary, setSummary] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const from = new Date(anchor + week * 7 * 86400000).toISOString();
  const to = new Date(anchor + (week + 1) * 7 * 86400000).toISOString();
  const query = {
    topicId,
    durationMinutes: duration,
    language,
    consultationMode: mode,
    timeZone: zone,
    from,
    to,
  };
  const availability = useResource(
    JSON.stringify(query),
    () => api.availability(query),
    step >= 1,
  );
  const lawyer = useResource(
    `selected-lawyer:${selected?.lawyerId}`,
    () => api.lawyer(selected!.lawyerId),
    Boolean(selected),
  );
  const zones = Array.from(
    new Set([browserZone(), "Etc/UTC", ...Intl.supportedValuesOf("timeZone")]),
  );
  const days = [
    ...new Set(
      (availability.data?.slots || []).map((slot) =>
        localDate(slot.startAt, zone),
      ),
    ),
  ];
  const chosenDay = days.includes(day) ? day : days[0];
  const slots = (availability.data?.slots || []).filter(
    (slot) => localDate(slot.startAt, zone) === chosenDay,
  );
  const price = topic.prices.find(
    (item) => item.durationMinutes === duration,
  )?.price;
  function changeTopic(id: string) {
    const next = topics.find((item) => item.id === id)!;
    setTopicId(id);
    setDuration(next.durationMinutesOptions[0]);
    setLanguage(next.languages.includes(lang) ? lang : next.languages[0]);
    setMode(next.consultationModes[0]);
    setSelected(undefined);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (!selected || !consent || !policiesConfigured || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const input = {
        slotId: selected.id,
        topicId,
        durationMinutes: duration,
        timeZone: zone,
        language,
        consultationMode: mode,
      };
      const booking = await api.createBooking(
        input,
        idempotencyKey(`book:${JSON.stringify(input)}`),
      );
      let intakeFailed = false;
      try {
        await api.saveIntake(booking.id, {
          summary: summary.trim() || undefined,
          preferredLanguage: language,
          consents: policyVersions,
        });
      } catch {
        intakeFailed = true;
      }
      navigate(
        path(
          "appointment",
          `${booking.id}/${lang === "es" ? "pago" : "payment"}`,
        ),
        { state: { intakeFailed } },
      );
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="wizard-layout">
      <div>
        <div className="wizard-steps" aria-label={t("how")}>
          {(["chooseService", "chooseTime", "review"] as const).map(
            (key, index) => (
              <span
                className={step === index ? "active" : ""}
                aria-current={step === index ? "step" : undefined}
                key={key}
              >
                <b>
                  {step > index ? <Icon name="check" size={14} /> : index + 1}
                </b>
                {t(key)}
              </span>
            ),
          )}
        </div>
        <form className="wizard-panel" onSubmit={submit}>
          <fieldset disabled={busy}>
            <h2>
              {t((["chooseService", "chooseTime", "review"] as const)[step])}
            </h2>
            {Boolean(error) && (
              <ErrorNotice
                error={error}
                retry={() => {
                  const slotConflict =
                    error instanceof ApiError && error.status === 409;
                  setError(undefined);
                  if (slotConflict) {
                    setStep(1);
                    setSelected(undefined);
                    availability.reload();
                  }
                }}
              />
            )}
            {step === 0 && (
              <>
                <label>
                  {t("selectService")}
                  <select
                    value={topicId}
                    onChange={(event) => changeTopic(event.target.value)}
                  >
                    {topics.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name[lang]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-row">
                  <label>
                    {t("duration")}
                    <select
                      value={duration}
                      onChange={(event) => {
                        setDuration(Number(event.target.value));
                        setSelected(undefined);
                      }}
                    >
                      {topic.durationMinutesOptions.map((value) => (
                        <option value={value} key={value}>
                          {value} {t("minutes")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t("language")}
                    <select
                      value={language}
                      onChange={(event) => {
                        setLanguage(event.target.value as Language);
                        setSelected(undefined);
                      }}
                    >
                      {topic.languages.map((value) => (
                        <option key={value} value={value}>
                          {value === "es" ? "Español" : "English"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  {t("mode")}
                  <select
                    value={mode}
                    onChange={(event) => {
                      setMode(event.target.value as Mode);
                      setSelected(undefined);
                    }}
                  >
                    {topic.consultationModes.map((value) => (
                      <option value={value} key={value}>
                        {t(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="fine-print">{topic.description[lang]}</p>
              </>
            )}
            {step === 1 && (
              <>
                <label>
                  {t("timezone")}
                  <select
                    value={zone}
                    onChange={(event) => {
                      setZone(event.target.value);
                      setDay("");
                      setSelected(undefined);
                    }}
                  >
                    {zones.map((value) => (
                      <option key={value} value={value}>
                        {value.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="zone-hint">{t("timezoneHelp")}</p>
                <div className="week-navigation">
                  <button
                    type="button"
                    disabled={week === 0}
                    onClick={() => {
                      setWeek(week - 1);
                      setDay("");
                      setSelected(undefined);
                    }}
                  >
                    <Icon name="arrow" className="rotate" size={16} />
                    {t("previousWeek")}
                  </button>
                  <button
                    type="button"
                    disabled={week >= 7}
                    onClick={() => {
                      setWeek(week + 1);
                      setDay("");
                      setSelected(undefined);
                    }}
                  >
                    {t("nextWeek")}
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
                {availability.loading ? (
                  <Loading />
                ) : availability.error ? (
                  <ErrorNotice
                    error={availability.error}
                    retry={availability.reload}
                  />
                ) : !slots.length ? (
                  <Alert>{t("noSlots")}</Alert>
                ) : (
                  <>
                    <h3 className="field-title">{t("date")}</h3>
                    <div className="date-grid">
                      {days.map((value) => {
                        const first = availability.data!.slots.find(
                          (slot) => localDate(slot.startAt, zone) === value,
                        )!;
                        return (
                          <button
                            className="date-button"
                            type="button"
                            aria-pressed={value === chosenDay}
                            key={value}
                            onClick={() => {
                              setDay(value);
                              setSelected(undefined);
                            }}
                          >
                            {new Intl.DateTimeFormat(lang, {
                              timeZone: zone,
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            }).format(new Date(first.startAt))}
                          </button>
                        );
                      })}
                    </div>
                    <h3 className="field-title">{t("time")}</h3>
                    <div className="slot-grid">
                      {slots.map((slot) => (
                        <button
                          className="slot-button"
                          type="button"
                          key={slot.id}
                          aria-pressed={selected?.id === slot.id}
                          onClick={() => setSelected(slot)}
                        >
                          {new Intl.DateTimeFormat(lang, {
                            timeZone: zone,
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(new Date(slot.startAt))}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            {step === 2 && (
              <>
                <label>
                  {t("note")}{" "}
                  <small>
                    {t("optional")} · {t("noteHelp")}
                  </small>
                  <textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    maxLength={2000}
                    rows={4}
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    required
                  />
                  {t("accept")}
                </label>
                <div className="policy-links">
                  <Link to={path("privacy")} target="_blank" rel="noopener">
                    {t("privacy")}
                  </Link>
                  <Link to={path("terms")} target="_blank" rel="noopener">
                    {t("terms")}
                  </Link>
                  <Link
                    to={path("cancellation")}
                    target="_blank"
                    rel="noopener"
                  >
                    {t("cancellation")}
                  </Link>
                </div>
                {!policiesConfigured && <Alert>{t("policyPending")}</Alert>}
                <p className="fine-print">{t("reservationNote")}</p>
              </>
            )}
            <div className="form-actions">
              {step > 0 && (
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setStep(step - 1)}
                >
                  <Icon name="arrow" className="rotate" size={16} />
                  {t("back")}
                </button>
              )}
              <button
                className="button"
                disabled={
                  busy ||
                  (step === 1 && (!selected || availability.loading)) ||
                  (step === 2 && (!consent || !policiesConfigured))
                }
              >
                {busy ? t("loading") : t(step === 2 ? "reserve" : "continue")}
                <Icon name="arrow" size={17} />
              </button>
            </div>
          </fieldset>
        </form>
      </div>
      <aside className="summary-panel">
        <p className="eyebrow">{t("selected")}</p>
        <h3>{topic.name[lang]}</h3>
        <div className="summary-row">
          <span>{t("duration")}</span>
          <strong>
            {duration} {t("minutes")}
          </strong>
        </div>
        <div className="summary-row">
          <span>{t("mode")}</span>
          <strong>{t(mode)}</strong>
        </div>
        <div className="summary-row">
          <span>{t("language")}</span>
          <strong>{language === "es" ? "Español" : "English"}</strong>
        </div>
        {selected && (
          <div className="summary-row">
            <span>{t("schedule")}</span>
            <strong>
              {dateTime(selected.startAt, zone, lang)}
              <br />
              <small>{zone}</small>
            </strong>
          </div>
        )}
        {lawyer.data && (
          <div className="summary-row">
            <span>{t("lawyer")}</span>
            <strong>{lawyer.data.displayName}</strong>
          </div>
        )}
        {price && (
          <div className="summary-row">
            <span>{t("from")}</span>
            <strong>{money(price.amount, price.currency, lang)}</strong>
          </div>
        )}
        <p className="fine-print">{t("reservationNote")}</p>
      </aside>
    </div>
  );
}
