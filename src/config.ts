function publicPolicyUrl(value: string | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
export const policyUrls = {
  privacy: publicPolicyUrl(import.meta.env.VITE_PRIVACY_URL),
  terms: publicPolicyUrl(import.meta.env.VITE_TERMS_URL),
  cancellation: publicPolicyUrl(import.meta.env.VITE_CANCELLATION_URL),
};
