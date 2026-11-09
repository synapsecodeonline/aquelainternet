export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://aquelainternet.vercel.app"
).replace(/\/+$/, "");

export const SITE_HOST = new URL(SITE_URL).host;
