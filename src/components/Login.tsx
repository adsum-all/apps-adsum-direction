import { useState } from "react";

import { ApiError, type Session, login } from "../api.js";

interface LoginProps {
  onAuth: (session: Session) => void;
}

const ALLOWED = new Set(["direction", "admin", "super_admin"]);

export function Login({ onAuth }: LoginProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await login(email, password);
      if (!ALLOWED.has(session.role)) {
        setError("Accès réservé a la direction.");
        return;
      }
      onAuth(session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur reseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <form onSubmit={submit} className="auth-card">
        <div className="brand brand-lg">
          <span className="brand-logo" aria-hidden="true">
            A
          </span>
          <span className="brand-text">
            ADSUM
            <span className="brand-sub">Direction</span>
          </span>
        </div>
        <label>
          <span>Courriel</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          <span>Mot de passe</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Connexion..." : "Se connecter"}
        </button>
        <p className="muted small center">Vue consolidée, lecture seule.</p>
      </form>
    </div>
  );
}
