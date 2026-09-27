import { Link } from "react-router-dom";
import { isDemo } from "../api";
import { Alert, Icon, PageHeading } from "../components/ui";
import { useTitle, useUi } from "../lib/hooks";
import type { PageName } from "../lib/routes";
import { policyUrls } from "../config";

export default function Information({
  kind,
}: {
  kind: "privacy" | "terms" | "cancellation" | "contact" | "notFound" | "team";
}) {
  const { t, path } = useUi();
  const title =
    kind === "contact"
      ? t("contactTitle")
      : kind === "team"
        ? t("teamTitle")
        : t(kind);
  useTitle(title);
  const legal = ["privacy", "terms", "cancellation"].includes(kind);
  const publishedUrl =
    kind === "privacy" || kind === "terms" || kind === "cancellation"
      ? policyUrls[kind]
      : "";
  return (
    <div className="container page information-page">
      <PageHeading
        eyebrow="LINDE"
        title={title}
        body={
          kind === "notFound"
            ? t("notFoundBody")
            : kind === "contact"
              ? t("supportBody")
              : kind === "team"
                ? t("teamBody")
                : undefined
        }
      />
      {legal && (
        <>
          {publishedUrl && !isDemo ? (
            <>
              <p>{t("publishedPolicy")}</p>
              <a
                className="button secondary"
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("readPolicy")}
                <Icon name="arrow" />
              </a>
            </>
          ) : (
            <>
              <Alert>{isDemo ? t("demoLegal") : t("legalPending")}</Alert>
              <p>{t("legalBody")}</p>
            </>
          )}
          <div className="policy-links">
            {(["privacy", "terms", "cancellation"] as const)
              .filter((item) => item !== kind)
              .map((item) => (
                <Link key={item} to={path(item)}>
                  {t(item)}
                </Link>
              ))}
          </div>
        </>
      )}
      <Link
        className="button"
        to={path((kind === "contact" ? "appointments" : "home") as PageName)}
      >
        {t(kind === "contact" ? "account" : "home")}
        <Icon name="arrow" />
      </Link>
    </div>
  );
}
