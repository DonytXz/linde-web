import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { errorKey, useUi } from "../lib/hooks";
import { ApiError } from "../api/http";
import type { Booking } from "../api/types";
import { statusLabels } from "../content";

const icons = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  calendar: "M7 3v4m10-4v4M4 10h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z",
  check: "m5 12 4 4L19 6",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  compass: "m16 8-2 6-6 2 2-6 6-2ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  family:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm4-3.87a4 4 0 0 1 0 7.75",
  work: "M9 7V4h6v3M3 8h18v12H3V8Zm0 5 9 3 9-3m-9 1v4",
  message: "M21 11a8 8 0 0 1-8 8H7l-5 3 2-7a8 8 0 1 1 17-4ZM8 10h8m-8 4h4",
  lock: "M6 10V7a6 6 0 0 1 12 0v3M4 10h16v11H4V10Zm8 4v3",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  video: "M3 6h12v12H3V6Zm12 4 6-3v10l-6-3",
  leaf: "M20 3C8 3 3 8 3 13a7 7 0 0 0 14 0c0-3 0-6 3-10ZM3 21 14 10",
} as const;
export function Icon({
  name,
  size = 22,
  className = "",
}: {
  name: keyof typeof icons;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={icons[name]} />
    </svg>
  );
}
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`logo ${inverse ? "inverse" : ""}`}>
      <svg viewBox="0 0 38 42" width="34" height="38" aria-hidden="true">
        <path
          d="M4 35V17C4 9 10 3 18 3s14 6 14 14v18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M13 15v20h22"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          d="M21 15v12h11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <span>
        linde<span className="logo-dot">.</span>
      </span>
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <header className="page-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 tabIndex={-1}>{title}</h1>
      {body && <p className="lede">{body}</p>}
    </header>
  );
}
export function Loading() {
  const { t } = useUi();
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      {t("loading")}
    </div>
  );
}
export function Alert({
  children,
  kind = "info",
}: {
  children: ReactNode;
  kind?: "info" | "error" | "success";
}) {
  return (
    <div
      className={`alert ${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function ErrorNotice({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const { t, path } = useUi();
  return (
    <Alert kind="error">
      <p>{t(errorKey(error))}</p>
      {error instanceof ApiError && error.status === 401 ? (
        <Link className="text-link" to={path("login")}>
          {t("login")} <Icon name="arrow" size={16} />
        </Link>
      ) : (
        retry && (
          <button className="text-link" onClick={retry}>
            {t("retry")} <Icon name="arrow" size={16} />
          </button>
        )
      )}
    </Alert>
  );
}
export function Status({ booking }: { booking: Booking }) {
  const { lang } = useUi();
  return (
    <span className={`status status-${booking.status}`}>
      <span />
      {statusLabels[lang][booking.status]}
    </span>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useUi();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="modal-content">
        <button
          className="icon-button modal-close"
          aria-label={t("close")}
          onClick={close}
        >
          <Icon name="close" />
        </button>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
