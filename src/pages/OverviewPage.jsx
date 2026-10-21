import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getKpiOverview, getKpiTopCompanies, getKpiTrend } from '../api/admin';
import { useAsync } from '../lib/useAsync';
import { formatInt, formatPct, formatTND, formatTNDShort } from '../lib/format';
import PeriodPicker from '../components/PeriodPicker';
import TrendChart from '../components/TrendChart';
import { Delta, Empty, ErrorNote, PageHeader, Skeleton, StatusBadge } from '../components/ui';

const FLOW_FIGURES = [
  { key: 'new_companies', label: 'Nouvelles entreprises' },
  { key: 'new_users', label: 'Nouveaux utilisateurs' },
  { key: 'active_users', label: 'Utilisateurs connectés' },
  { key: 'payments_collected', label: 'Paiements encaissés', money: true },
  { key: 'collection_rate_pct', label: 'Taux d’encaissement', pct: true },
  { key: 'quote_conversion_pct', label: 'Devis transformés en facture', pct: true },
  { key: 'invitations_accepted', label: 'Invitations acceptées' },
];

const TREND_METRICS = [
  { key: 'revenue_billed_ttc', label: 'Facturé TTC', money: true },
  { key: 'payments_collected', label: 'Encaissé', money: true },
  { key: 'invoice_count', label: 'Factures' },
  { key: 'movement_count', label: 'Mouvements de stock' },
  { key: 'new_companies', label: 'Nouvelles entreprises' },
  { key: 'new_users', label: 'Nouveaux utilisateurs' },
];

const RANKINGS = [
  { key: 'revenue', label: 'Chiffre facturé', money: true },
  { key: 'invoices', label: 'Factures' },
  { key: 'movements', label: 'Mouvements' },
  { key: 'users', label: 'Utilisateurs connectés' },
];

const plural = (n, one, many) => `${formatInt(n)} ${Number(n) > 1 ? many : one}`;

function Figure({ value, children }) {
  return (
    <span className="lede__fig" title={value}>
      {children}
    </span>
  );
}

export default function OverviewPage() {
  const [period, setPeriod] = useState({ period: 'month' });
  const [metric, setMetric] = useState(TREND_METRICS[0]);
  const [ranking, setRanking] = useState(RANKINGS[0]);
  const [months, setMonths] = useState(12);

  const overview = useAsync(() => getKpiOverview(period).then((r) => r.data), [period]);
  const trend = useAsync(() => getKpiTrend(months).then((r) => r.data), [months]);
  const top = useAsync(
    () => getKpiTopCompanies({ by: ranking.key, limit: 10, ...period }).then((r) => r.data),
    [ranking, period]
  );

  const k = overview.data?.kpis;
  const snap = overview.data?.snapshot;

  return (
    <div className="page">
      <PageHeader
        title="Vue d’ensemble"
        actions={<PeriodPicker value={period} onChange={setPeriod} />}
      />

      {/* ── Le fait principal de la période, écrit comme une phrase ── */}
      <section className="lede" aria-live="polite">
        {overview.error && <ErrorNote error={overview.error} onRetry={overview.reload} />}
        {!overview.data && !overview.error && <Skeleton lines={2} tall />}
        {k && (
          <>
            <p className="lede__period">{overview.data.period.label}</p>
            <p className={`lede__text ${overview.loading ? 'is-stale' : ''}`}>
              <Figure>{plural(k.active_companies.value, 'entreprise active', 'entreprises actives')}</Figure>{' '}
              {Number(k.active_companies.value) > 1 ? 'ont' : 'a'} facturé{' '}
              <Figure value={formatTND(k.revenue_billed_ttc.value)}>
                {formatTNDShort(k.revenue_billed_ttc.value)}
              </Figure>{' '}
              en <Figure>{plural(k.invoice_count.value, 'facture', 'factures')}</Figure>, et
              enregistré <Figure>{plural(k.movement_count.value, 'mouvement', 'mouvements')}</Figure>{' '}
              de stock.
            </p>
            <ul className="lede__deltas">
              <li>
                Entreprises actives <Delta pct={k.active_companies.delta_pct} />
              </li>
              <li>
                Facturé <Delta pct={k.revenue_billed_ttc.delta_pct} />
              </li>
              <li>
                Factures <Delta pct={k.invoice_count.delta_pct} />
              </li>
              <li>
                Mouvements <Delta pct={k.movement_count.delta_pct} />
              </li>
            </ul>
            <p className="lede__note">Comparé à la période précédente de même durée.</p>
          </>
        )}
      </section>

      {k && (
        <section className="section" aria-labelledby="flow-title">
          <h2 id="flow-title" className="section__title">
            Sur la période
          </h2>
          <dl className="figures">
            {FLOW_FIGURES.map((f) => (
              <div key={f.key} className="figures__item">
                <dt>{f.label}</dt>
                <dd>
                  <span className="figures__value">
                    {f.money
                      ? formatTND(k[f.key].value)
                      : f.pct
                        ? formatPct(k[f.key].value)
                        : formatInt(k[f.key].value)}
                  </span>
                  <Delta pct={k[f.key].delta_pct} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="split">
        <section className="panel" aria-labelledby="trend-title">
          <div className="panel__head">
            <h2 id="trend-title" className="section__title">
              Évolution mensuelle
            </h2>
            <div className="panel__controls">
              <label className="select">
                <span className="sr-only">Mesure</span>
                <select
                  value={metric.key}
                  onChange={(e) => setMetric(TREND_METRICS.find((m) => m.key === e.target.value))}
                >
                  {TREND_METRICS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="select">
                <span className="sr-only">Durée</span>
                <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                  <option value={6}>6 mois</option>
                  <option value={12}>12 mois</option>
                  <option value={24}>24 mois</option>
                </select>
              </label>
            </div>
          </div>
          {trend.error && <ErrorNote error={trend.error} onRetry={trend.reload} />}
          {!trend.data && !trend.error && <Skeleton lines={6} />}
          {trend.data && (
            <TrendChart
              series={trend.data.series}
              field={metric.key}
              money={metric.money}
              label={metric.label}
            />
          )}
        </section>

        <section className="panel" aria-labelledby="park-title">
          <h2 id="park-title" className="section__title">
            Le parc aujourd’hui
          </h2>
          {!snap && !overview.error && <Skeleton lines={6} />}
          {snap && (
            <dl className="ledger">
              <div>
                <dt>Entreprises</dt>
                <dd>
                  {formatInt(snap.companies.total)}
                  <span className="muted">, dont {formatInt(snap.companies.suspended)} suspendues</span>
                </dd>
              </div>
              <div>
                <dt>Utilisateurs</dt>
                <dd>
                  {formatInt(snap.users.total)}
                  <span className="muted">, {formatPct(snap.users.activation_rate_pct)} activés</span>
                </dd>
              </div>
              <div>
                <dt>Connectés sur 7 jours</dt>
                <dd>{formatInt(snap.users.weekly_active)}</dd>
              </div>
              <div>
                <dt>Connectés sur 30 jours</dt>
                <dd>{formatInt(snap.users.monthly_active)}</dd>
              </div>
              <div>
                <dt>Fidélité (7 j / 30 j)</dt>
                <dd>{formatPct(snap.users.stickiness_pct)}</dd>
              </div>
              <div>
                <dt>Utilisateurs par entreprise</dt>
                <dd>{formatInt(snap.users.avg_per_company)}</dd>
              </div>
              <div>
                <dt>Rôles</dt>
                <dd>
                  {formatInt(snap.users.by_company_role.OWNER)} gérants,{' '}
                  {formatInt(snap.users.by_company_role.STOCK)} magasiniers,{' '}
                  {formatInt(snap.users.by_company_role.ACCOUNTANT)} comptables
                </dd>
              </div>
              <div>
                <dt>Catalogue</dt>
                <dd>
                  {formatInt(snap.catalog.products)} produits, {formatInt(snap.catalog.clients)}{' '}
                  clients, {formatInt(snap.catalog.suppliers)} fournisseurs
                </dd>
              </div>
              <div>
                <dt>Factures à encaisser</dt>
                <dd>{formatTND(snap.receivables.outstanding_ttc)}</dd>
              </div>
              <div>
                <dt>Invitations en attente</dt>
                <dd>{formatInt(snap.pending_invitations)}</dd>
              </div>
            </dl>
          )}
        </section>
      </div>

      <section className="panel" aria-labelledby="top-title">
        <div className="panel__head">
          <h2 id="top-title" className="section__title">
            Entreprises les plus actives
          </h2>
          <div className="segmented segmented--small" role="radiogroup" aria-label="Classer par">
            {RANKINGS.map((r) => (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={ranking.key === r.key}
                className="segmented__item"
                onClick={() => setRanking(r)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {top.error && <ErrorNote error={top.error} onRetry={top.reload} />}
        {!top.data && !top.error && <Skeleton lines={5} />}
        {top.data && top.data.ranking.length === 0 && (
          <Empty title="Aucune activité sur cette période">
            Choisissez une période plus longue pour voir un classement.
          </Empty>
        )}
        {top.data && top.data.ranking.length > 0 && (
          <RankingList rows={top.data.ranking} money={ranking.money} stale={top.loading} />
        )}
      </section>
    </div>
  );
}

function RankingList({ rows, money, stale }) {
  const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1);
  return (
    <ol className={`ranking ${stale ? 'is-stale' : ''}`}>
      {rows.map((r) => (
        <li key={r.company.id} className="ranking__row">
          <span className="ranking__rank">{r.rank}</span>
          <span className="ranking__name">
            <Link to={`/entreprises/${r.company.id}`}>{r.company.name || 'Entreprise supprimée'}</Link>
            {r.company.is_active === false && <StatusBadge active={false} />}
          </span>
          <span className="ranking__bar" aria-hidden="true">
            <span style={{ width: `${(Number(r.value) / max) * 100}%` }} />
          </span>
          <span className="ranking__value">{money ? formatTND(r.value) : formatInt(r.value)}</span>
        </li>
      ))}
    </ol>
  );
}
