const UTM_STORAGE_KEY = "utm_params";

export const captureUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.toString().length === 0) return;

  // Merge new params with existing stored ones (new values override old)
  const existing = getUtmParams() || {};
  const incoming: Record<string, string> = {};
  params.forEach((value, key) => {
    incoming[key] = value;
  });

  const merged = { ...existing, ...incoming };
  localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
};

export const getUtmParams = (): Record<string, string> | null => {
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
};

/** Returns stored params as a query string (without leading ?) */
export const getUtmQueryString = (): string => {
  const params = getUtmParams();
  if (!params) return "";
  return new URLSearchParams(params).toString();
};