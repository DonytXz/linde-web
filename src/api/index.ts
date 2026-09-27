import { createHttpApi } from "./http";
import type { ClientApi } from "./types";
import { policyUrls } from "../config";

export const isDemo =
  import.meta.env.DEV && import.meta.env.VITE_API_MODE === "demo";
export const isConfigured =
  isDemo || Boolean(import.meta.env.VITE_API_BASE_URL);
// Vite removes this branch and its fixtures from a production build.
export const api: ClientApi = isDemo
  ? (await import("./demo")).demoApi
  : createHttpApi(import.meta.env.VITE_API_BASE_URL || "");
export const policyVersions = {
  privacyNoticeVersion: isDemo
    ? "demo-privacy-v1"
    : import.meta.env.VITE_PRIVACY_VERSION || "",
  termsVersion: isDemo
    ? "demo-terms-v1"
    : import.meta.env.VITE_TERMS_VERSION || "",
};
export const policiesConfigured = Boolean(
  policyVersions.privacyNoticeVersion &&
  policyVersions.termsVersion &&
  (isDemo ||
    (policyUrls.privacy && policyUrls.terms && policyUrls.cancellation)),
);
