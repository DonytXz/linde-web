import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { Booking } from "../api/types";
import {
  Alert,
  ErrorNotice,
  Icon,
  Loading,
  PageHeading,
  Status,
} from "../components/ui";
import { dateTime } from "../lib/format";
import { useResource, useTitle, useUi } from "../lib/hooks";

export default function Dashboard() {
  const { t, lang, path } = useUi();
  useTitle(t("account"));
  const [filter, setFilter] = useState<"upcoming" | "all" | "past">("upcoming");
  const [extra, setExtra] = useState<Booking[]>([]);
  const [next, setNext] = useState<string | null | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const bookings = useResource("appointments", () => api.bookings());
  const topics = useResource("appointment-topics", () => api.topics());
  const all = [...(bookings.data?.data || []), ...extra].filter(
    (item, index, items) =>
      items.findIndex((value) => value.id === item.id) === index,
  );
  const visible = all.filter(
    (item) =>
      filter === "all" ||
      (filter === "upcoming"
        ? ["pendingPayment", "confirmed"].includes(item.status) &&
          Date.parse(item.endAt) >= Date.now()
        : !["pendingPayment", "confirmed"].includes(item.status) ||
          Date.parse(item.endAt) < Date.now()),
  );
  const cursor =
    next === undefined ? bookings.data?.pagination.nextCursor : next;
  async function loadMore() {
    if (!cursor) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await api.bookings(cursor);
      setExtra((previous) => [...previous, ...result.data]);
      setNext(result.pagination.nextCursor);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <div className="dashboard-heading">
        <PageHeading
          eyebrow={t("dashboardEyebrow")}
          title={t("dashboardTitle")}
          body={t("dashboardBody")}
        />
        <Link className="button" to={path("book")}>
          {t("book")}
          <Icon name="plus" size={18} />
        </Link>
      </div>
      <div className="tabs" aria-label={t("account")}>
        {(["upcoming", "all", "past"] as const).map((value) => (
          <button
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            key={value}
          >
            {t(value)}
          </button>
        ))}
      </div>
      {bookings.loading ? (
        <Loading />
      ) : bookings.error ? (
        <ErrorNotice error={bookings.error} retry={bookings.reload} />
      ) : visible.length ? (
        <div className="appointment-list">
          {visible.map((booking) => (
            <article className="appointment-card" key={booking.id}>
              <div className="appointment-date" aria-hidden="true">
                {new Intl.DateTimeFormat(lang, {
                  timeZone: booking.timeZone,
                  day: "numeric",
                }).format(new Date(booking.startAt))}
              </div>
              <div className="appointment-info">
                <Status booking={booking} />
                <h2>
                  {topics.data?.find((topic) => topic.id === booking.topicId)
                    ?.name[lang] || t("appointmentTitle")}
                </h2>
                <p>
                  {dateTime(booking.startAt, booking.timeZone, lang)} ·{" "}
                  {booking.timeZone}
                </p>
                <p>{t(booking.consultationMode)}</p>
              </div>
              <Link
                className="button secondary"
                to={path("appointment", booking.id)}
              >
                {t("details")}
                <Icon name="arrow" size={17} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-appointments">
          <Icon name="calendar" size={42} />
          <h2>{t("emptyAppointments")}</h2>
          <p>{t("emptyAppointmentsBody")}</p>
          <Link className="button" to={path("book")}>
            {t("book")}
            <Icon name="arrow" />
          </Link>
        </div>
      )}
      {Boolean(topics.error) && <Alert>{t("error")}</Alert>}
      {Boolean(error) && <ErrorNotice error={error} retry={loadMore} />}
      {cursor && (
        <button
          className="button secondary pagination-button"
          onClick={loadMore}
          disabled={busy}
        >
          {t(busy ? "loading" : "loadMore")}
        </button>
      )}
    </div>
  );
}
