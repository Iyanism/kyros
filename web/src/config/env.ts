export const env = {
  // Empty string = same-origin requests (proxied to the API in dev by vite.config.ts).
  // Set VITE_API_URL only when the API is served from a different origin.
  apiUrl: import.meta.env.VITE_API_URL ?? "",
};
