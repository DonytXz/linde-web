import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api";
import type { Topic } from "../api/types";
import { ErrorNotice, Icon, Loading } from "../components/ui";
import { useResource, useTitle, useUi } from "../lib/hooks";
import { money } from "../lib/format";

export function ServiceCard({ topic, index }: { topic: Topic; index: number }) {
  const { t, lang, path } = useUi();
  const price = topic.prices[0]?.price;
  const icon = (["compass", "family", "work", "message"] as const)[index % 4];
  return (
    <Link to={path("services", topic.slug)} className="service-card">
      <div className="service-card-top">
        <span className="service-icon">
          <Icon name={icon} size={30} />
        </span>
        <span className="service-index">0{index + 1}</span>
      </div>
      <h3>{topic.name[lang]}</h3>
      <p>{topic.description[lang]}</p>
      <div className="service-card-bottom">
        <span>
          {price
            ? `${t("from")} ${money(price.amount, price.currency, lang)}`
            : t("discover")}
        </span>
        <span className="circle-arrow">
          <Icon name="arrow" size={19} />
        </span>
      </div>
    </Link>
  );
}
export default function Home() {
  const { t, path } = useUi();
  const location = useLocation();
  const services = useResource("home-topics", () => api.topics());
  useTitle(t("footerBody"));
  useEffect(() => {
    if (location.hash)
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
  }, [location.hash]);
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-line" />
            {t("heroEyebrow")}
          </p>
          <h1>
            {t("heroTitle")}
            <br />
            <em>{t("heroEmphasis")}</em>
          </h1>
          <p className="hero-body">{t("heroBody")}</p>
          <div className="hero-actions">
            <Link className="button" to={path("book")}>
              {t("book")}
              <Icon name="arrow" size={19} />
            </Link>
            <Link className="text-link" to={path("services")}>
              {t("heroSecondary")}
            </Link>
          </div>
          <div className="hero-note">
            <span className="note-symbol">
              <Icon name="leaf" size={18} />
            </span>
            {t("heroNote")}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-art-frame">
            <img
              className="hero-art"
              src="/brand/pathway.svg"
              width="600"
              height="650"
              alt={t("heroArt")}
              fetchPriority="high"
            />
            <div className="art-label">
              <span>LINDE / 01</span>
              <span>{t("footerBody")}</span>
            </div>
          </div>
          <div className="hero-floating-note">
            <span className="floating-icon">
              <Icon name="message" size={26} />
            </span>
            <span>
              {t("heroNote")}
              <small>{t("tagline")}</small>
            </span>
          </div>
          <span className="hero-orbit" aria-hidden="true" />
        </div>
      </section>
      <div className="values-strip">
        <div className="container">
          {(["stripOne", "stripTwo", "stripThree"] as const).map(
            (key, index) => (
              <span key={key}>
                <Icon
                  name={(["message", "check", "globe"] as const)[index]}
                  size={19}
                />
                {t(key)}
              </span>
            ),
          )}
        </div>
      </div>
      <section className="section container" id="services">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t("servicesEyebrow")}</p>
            <h2>{t("servicesTitle")}</h2>
            <p className="section-intro">{t("servicesBody")}</p>
          </div>
          <Link className="text-link" to={path("services")}>
            {t("allServices")}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
        {services.loading ? (
          <Loading />
        ) : services.error ? (
          <ErrorNotice error={services.error} retry={services.reload} />
        ) : services.data?.length ? (
          <div className="services-grid">
            {services.data.slice(0, 3).map((topic, index) => (
              <ServiceCard key={topic.id} topic={topic} index={index} />
            ))}
          </div>
        ) : (
          <p className="empty-note">{t("emptyServices")}</p>
        )}
      </section>
      <section className="approach-section" id="approach">
        <div className="container approach-grid">
          <div className="approach-art" aria-hidden="true">
            <svg viewBox="0 0 440 500" fill="none">
              <path
                d="M80 480V220C80 35 365 35 365 220v260"
                stroke="#c7b798"
                strokeWidth="2"
              />
              <path
                d="M110 480V220c0-145 224-145 224 0v260"
                stroke="#c7b798"
                strokeWidth="2"
              />
              <path d="M141 480V220c0-105 162-105 162 0v260" fill="#ece6da" />
              <circle cx="224" cy="218" r="56" fill="#b66c4e" />
              <path
                d="M70 480c70-200 130-60 170-169 18-49 52-48 65-34"
                stroke="#173e3b"
                strokeWidth="44"
              />
              <path d="m251 272 24-36 20 28-18 16" fill="#f4f0e7" />
            </svg>
            <span className="art-corner-mark">L.</span>
          </div>
          <div className="approach-copy">
            <p className="eyebrow">{t("approachEyebrow")}</p>
            <h2>{t("approachTitle")}</h2>
            <p>{t("approachBody")}</p>
            <div className="value-list">
              {(["One", "Two", "Three"] as const).map((number, index) => (
                <div key={number}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{t(`value${number}`)}</h3>
                    <p>{t(`value${number}Body`)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link className="text-link" to={path("book")}>
              {t("approachLink")}
              <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section container" id="how-it-works">
        <div className="section-heading centered">
          <p className="eyebrow">{t("howEyebrow")}</p>
          <h2>{t("howTitle")}</h2>
        </div>
        <div className="steps-grid">
          {(["One", "Two", "Three"] as const).map((number, index) => (
            <div className="process-step" key={number}>
              <div className="step-number">
                0{index + 1}
                <span />
              </div>
              <h3>{t(`step${number}`)}</h3>
              <p>{t(`step${number}Body`)}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container cta-wrap">
        <div className="cta">
          <span className="cta-motif" aria-hidden="true" />
          <div>
            <p className="eyebrow">LINDE</p>
            <h2>{t("ctaTitle")}</h2>
            <p>{t("ctaBody")}</p>
          </div>
          <Link className="button light" to={path("book")}>
            {t("book")}
            <Icon name="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}
