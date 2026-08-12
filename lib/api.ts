// Thin fetch wrapper that unwraps the { ok, data } | { ok, error } envelope.
export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError('Unexpected server response', 'INTERNAL', res.status);
  }
  const env = json as
    | { ok: true; data: T }
    | { ok: false; error: { code: string; message: string } };
  if (!env.ok) {
    throw new ApiError(env.error.message, env.error.code, res.status);
  }
  return env.data;
}

export function post<T = unknown>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

export function get<T = unknown>(path: string): Promise<T> {
  return api<T>(path, { cache: 'no-store' });
}
