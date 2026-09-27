import type { Language } from "../api/types";
const segments = {
  es: {
    home: "",
    services: "servicios",
    book: "agendar",
    appointments: "mis-citas",
    appointment: "citas",
    login: "ingresar",
    register: "crear-cuenta",
    forgot: "recuperar",
    reset: "restablecer",
    verify: "verificar",
    contact: "contacto",
    privacy: "privacidad",
    terms: "terminos",
    cancellation: "cancelaciones",
    team: "equipo",
    admin: "administracion",
  },
  en: {
    home: "",
    services: "services",
    book: "book",
    appointments: "appointments",
    appointment: "booking",
    login: "login",
    register: "register",
    forgot: "forgot-password",
    reset: "reset-password",
    verify: "verify-email",
    contact: "contact",
    privacy: "privacy",
    terms: "terms",
    cancellation: "cancellations",
    team: "team",
    admin: "admin",
  },
} as const;
export type PageName = keyof typeof segments.es;
export function route(lang: Language, page: PageName, suffix = "") {
  return `/${lang}${segments[lang][page] ? `/${segments[lang][page]}` : ""}${suffix ? `/${suffix}` : ""}`;
}
export function swapLanguage(path: string, language: Language) {
  const parts = path.split("/");
  const source: Language = parts[1] === "en" ? "en" : "es";
  const key = (Object.keys(segments[source]) as PageName[]).find(
    (key) => segments[source][key] === (parts[2] || ""),
  );
  const suffix = parts.slice(3);
  if (key === "appointment" && suffix.length > 1) {
    const last = suffix.length - 1;
    if (["pago", "payment"].includes(suffix[last]))
      suffix[last] = language === "es" ? "pago" : "payment";
    if (["confirmacion", "confirmation"].includes(suffix[last]))
      suffix[last] = language === "es" ? "confirmacion" : "confirmation";
  }
  return key ? route(language, key, suffix.join("/")) : route(language, "home");
}
