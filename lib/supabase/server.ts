type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

type SupabaseRestOptions = RequestInit & {
  prefer?: string;
};

export class SupabaseApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SupabaseApiError";
    this.status = status;
  }
}

export function getSupabaseServerConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

export function isSupabaseServerConfigured() {
  return getSupabaseServerConfig() !== null;
}

export async function supabaseRest<T>(
  path: string,
  options: SupabaseRestOptions = {},
) {
  const config = getSupabaseServerConfig();

  if (!config) {
    throw new SupabaseApiError("Supabase is not configured.", 503);
  }

  const headers = new Headers(options.headers);
  headers.set("apikey", config.serviceRoleKey);
  headers.set("Authorization", `Bearer ${config.serviceRoleKey}`);
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.prefer) {
    headers.set("Prefer", options.prefer);
  }

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new SupabaseApiError(
      text || `Supabase request failed with status ${response.status}.`,
      response.status,
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
