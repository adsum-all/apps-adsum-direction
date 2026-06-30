// Thin read-only client for the ADSUM API, used by the direction dashboard.
// The direction role has read access to the aggregated statistics endpoint.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://adsum-api.vercel.app";

export type Role = "direction" | "admin" | "super_admin" | string;

export interface Session {
  token: string;
  role: Role;
}

export interface Statistiques {
  membres_total: number;
  membres_actifs: number;
  membres_verifies: number;
  membres_en_attente: number;
  evenements_total: number;
  presences_total: number;
  commissions_total: number;
  intendances_total: number;
  par_commission: { commission: string; total: number }[];
  par_cheminement: { cheminement: string; total: number }[];
  entrees_mensuelles: { mois: string; total: number }[];
  membres_a_verifier: { id: string; matricule: string; prenoms: string | null; nom: string | null }[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function login(email: string, password: string): Promise<Session> {
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new ApiError(res.status === 401 ? "Identifiants invalides" : "Service indisponible", res.status);
  }
  const data = (await res.json()) as { access_token: string; role?: Role };
  return { token: data.access_token, role: data.role ?? "" };
}

export async function getStatistiques(token: string): Promise<Statistiques> {
  const res = await fetch(`${BASE}/api/v1/admin/statistiques`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const message =
      res.status === 401 ? "Session expiree" : res.status === 403 ? "Acces refuse" : "Statistiques indisponibles";
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as Statistiques;
}

export function apiBaseUrl(): string {
  return BASE;
}
