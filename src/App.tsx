import { useCallback, useState } from "react";

import { type Session, getStatistiques } from "./api.js";
import { BarChart, DonutChart, LineChart, type ChartDatum } from "./components/Charts.js";
import { Login } from "./components/Login.js";
import { useResource } from "./useResource.js";

const MONTHS_FR = ["janv.", "fevr.", "mars", "avr.", "mai", "juin", "juil.", "aout", "sept.", "oct.", "nov.", "dec."];

const CHEMINEMENT_LABELS: Record<string, string> = {
  nouveau: "Nouveau",
  en_accompagnement: "En accompagnement",
  membre_actif: "Membre actif",
  responsable: "Responsable",
  a_relancer: "A relancer",
  en_pause: "En pause",
  ancien_membre: "Ancien membre",
};

function toSeries(rows: { mois: string; total: number }[]): ChartDatum[] {
  return rows.map((r) => {
    const month = Number(r.mois.slice(5, 7)) - 1;
    return { label: MONTHS_FR[month] ?? r.mois, value: r.total };
  });
}

export function App(): JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const onAuth = useCallback((s: Session) => setSession(s), []);

  if (!session) {
    return <Login onAuth={onAuth} />;
  }
  return <DirectionDashboard session={session} onLogout={() => setSession(null)} />;
}

function DirectionDashboard({ session, onLogout }: { session: Session; onLogout: () => void }): JSX.Element {
  const { data, loading, error } = useResource(() => getStatistiques(session.token), [session.token]);

  const entries = data ? toSeries(data.entrees_mensuelles) : [];
  const tauxVerif = data && data.membres_total > 0 ? Math.round((data.membres_verifies / data.membres_total) * 100) : 0;

  return (
    <div className="main">
      <header className="topbar-app">
        <div className="brand">
          <span className="brand-logo" aria-hidden="true">
            A
          </span>
          <span className="brand-text">
            ADSUM
            <span className="brand-sub">Direction</span>
          </span>
        </div>
        <span className="event-chip" title="Lecture seule">
          <span className="event-dot" aria-hidden="true" />
          Vue consolidée, lecture seule
        </span>
        <button type="button" className="link" onClick={onLogout}>
          Déconnexion
        </button>
      </header>

      <div className="main-scroll">
        <div className="page">
          <header className="page-head">
            <div>
              <h1>Pilotage de la direction</h1>
              <p className="muted">Indicateurs consolidés, sur les données réelles du Sacerdoce Royal.</p>
            </div>
          </header>

          {error && <p className="banner banner-error">{error}</p>}

          <div className="kpi-grid">
            <Kpi label="Membres" value={data?.membres_total} hint={`${data?.membres_actifs ?? 0} actifs`} loading={loading} accent />
            <Kpi label="Taux de vérification" value={tauxVerif} suffix="%" hint={`${data?.membres_en_attente ?? 0} en attente`} loading={loading} />
            <Kpi label="Présences cumulées" value={data?.presences_total} hint={`${data?.evenements_total ?? 0} événements`} loading={loading} />
            <Kpi label="Commissions" value={data?.commissions_total} hint={`${data?.intendances_total ?? 0} intendances`} loading={loading} />
          </div>

          <div className="card-grid-2">
            <section className="card">
              <h2 className="card-title">Tendance des entrées, 12 derniers mois</h2>
              {loading ? <p className="muted">Chargement...</p> : <LineChart points={entries} />}
            </section>
            <section className="card">
              <h2 className="card-title">Vérification d'identité</h2>
              {loading || !data ? (
                <p className="muted">Chargement...</p>
              ) : (
                <DonutChart
                  centerLabel="membres"
                  segments={[
                    { label: "Vérifiés", value: data.membres_verifies },
                    { label: "En attente", value: data.membres_en_attente },
                  ]}
                />
              )}
            </section>
          </div>

          <div className="card-grid-2">
            <section className="card">
              <h2 className="card-title">Répartition par cheminement pastoral</h2>
              {loading || !data ? (
                <p className="muted">Chargement...</p>
              ) : (
                <DonutChart
                  centerLabel="membres"
                  segments={data.par_cheminement.map((r) => ({
                    label: CHEMINEMENT_LABELS[r.cheminement] ?? r.cheminement ?? "-",
                    value: r.total,
                  }))}
                />
              )}
            </section>
            <section className="card">
              <h2 className="card-title">Comparaison par commission</h2>
              {loading || !data ? (
                <p className="muted">Chargement...</p>
              ) : (
                <BarChart items={data.par_commission.map((r) => ({ label: r.commission ?? "Sans", value: r.total }))} />
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

interface KpiProps {
  label: string;
  value: number | undefined;
  hint: string;
  loading: boolean;
  accent?: boolean;
  suffix?: string;
}

function Kpi({ label, value, hint, loading, accent, suffix }: KpiProps): JSX.Element {
  return (
    <div className={`kpi ${accent ? "kpi-accent" : ""}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">
        {loading || value === undefined ? "..." : `${value.toLocaleString("fr-FR")}${suffix ?? ""}`}
      </span>
      <span className="kpi-hint">{hint}</span>
    </div>
  );
}
