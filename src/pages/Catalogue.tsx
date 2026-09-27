import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useResource, useTitle, useUi } from "../lib/hooks";
import {
  Alert,
  ErrorNotice,
  Icon,
  Loading,
  PageHeading,
} from "../components/ui";
import { ServiceCard } from "./Home";
import { money } from "../lib/format";

export default function Catalogue() {
  const { slug } = useParams();
  const { t, lang, path } = useUi();
  const resource = useResource("catalogue", () => api.topics());
  const topic = resource.data?.find(
    (item) => item.slug === slug || item.id === slug,
  );
  useTitle(topic ? topic.name[lang] : t("services"));
  if (resource.loading)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (resource.error)
    return (
      <div className="container page">
        <PageHeading title={t("catalogueTitle")} />
        <ErrorNotice error={resource.error} retry={resource.reload} />
      </div>
    );
  if (slug && !topic)
    return (
      <div className="container page">
        <PageHeading title={t("notFound")} />
        <Link className="button" to={path("services")}>
          {t("services")}
        </Link>
      </div>
    );
  return (
    <div className="container page">
      {topic ? (
        <>
          <Link className="text-link back-link" to={path("services")}>
            <Icon name="arrow" className="rotate" size={16} />
            {t("services")}
          </Link>
          <PageHeading
            eyebrow={t("serviceIntro")}
            title={topic.name[lang]}
            body={topic.description[lang]}
          />
          <div className="detail-grid">
            <div>
              <h2>{t("serviceDetails")}</h2>
              <p>{t("preparationBody")}</p>
              <div className="service-facts">
                <div>
                  <Icon name="clock" />
                  <h3>{t("duration")}</h3>
                  <p>
                    {topic.durationMinutesOptions.join(" / ")} {t("minutes")}
                  </p>
                </div>
                <div>
                  <Icon name="globe" />
                  <h3>{t("language")}</h3>
                  <p>
                    {topic.languages
                      .map((item) => (item === "es" ? "Español" : "English"))
                      .join(" / ")}
                  </p>
                </div>
                <div>
                  <Icon name="video" />
                  <h3>{t("mode")}</h3>
                  <p>
                    {topic.consultationModes.map((item) => t(item)).join(" · ")}
                  </p>
                </div>
              </div>
              <h3>{t("jurisdiction")}</h3>
              <p>{topic.jurisdictions.join(" · ")}</p>
            </div>
            <aside className="summary-panel">
              <p className="eyebrow">{t("selected")}</p>
              <h3>{topic.name[lang]}</h3>
              {topic.prices.map((item) => (
                <div
                  className="summary-row"
                  key={`${item.durationMinutes}-${item.price.currency}`}
                >
                  <span>
                    {item.durationMinutes} {t("minutes")}
                  </span>
                  <strong>
                    {money(item.price.amount, item.price.currency, lang)}
                  </strong>
                </div>
              ))}
              <Link
                className="button full"
                to={`${path("book")}?service=${encodeURIComponent(topic.id)}`}
              >
                {t("book")}
                <Icon name="arrow" size={18} />
              </Link>
              <p className="fine-print">{t("reservationNote")}</p>
            </aside>
          </div>
        </>
      ) : (
        <>
          <PageHeading
            eyebrow={t("servicesEyebrow")}
            title={t("catalogueTitle")}
            body={t("catalogueBody")}
          />
          {resource.data?.length ? (
            <div className="services-grid catalogue-grid">
              {resource.data.map((item, index) => (
                <ServiceCard topic={item} index={index} key={item.id} />
              ))}
            </div>
          ) : (
            <Alert>{t("emptyServices")}</Alert>
          )}
        </>
      )}
    </div>
  );
}
