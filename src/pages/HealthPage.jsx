import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, TriangleAlert, CircleCheck } from 'lucide-react';
import { getKpiHealth, setUserActive } from '../api/admin';
import { useAsync } from '../lib/useAsync';
import { formatDate, formatDateTime, formatInt, formatRelative } from '../lib/format';
import UserStatusDialog from '../components/UserStatusDialog';
import { useToast } from '../components/Toast';
import { ErrorNote, PageHeader, Skeleton } from '../components/ui';

const ALERTS = [
  {
    key: 'dormant_companies',
    title: 'Entreprises inactives',
    advice: 'Elles n’ont émis aucune facture ni enregistré de mouvement récemment. Prenez contact pour comprendre ce qui bloque.',
    kind: 'company',
  },
  {
    key: 'onboarding_incomplete',
    title: 'Démarrage inachevé',
    advice: 'Inscrites depuis plus d’une semaine, elles n’ont encore créé aucun produit.',
    kind: 'company',
  },
  {
    key: 'unverified_users',
    title: 'Comptes jamais vérifiés',
    advice: 'Le code reçu par email n’a pas été saisi. Vous pouvez activer le compte manuellement après vérification.',
    kind: 'user',
  },
];

export default function HealthPage() {
  const health = useAsync(() => getKpiHealth().then((r) => r.data), []);
  const [pending, setPending] = useState(null);
  const notify = useToast();

  const activate = async () => {
    const res = await setUserActive(pending.id, true);
    health.mutate((d) => {
      const sample = d.unverified_users.sample.filter((u) => u.id !== pending.id);
      return { ...d, unverified_users: { ...d.unverified_users, count: d.unverified_users.count - 1, sample } };
    });
    notify(res.message);
  };

  return (
    <div className="page">
      <PageHeader
        title="Santé de la plateforme"
        intro={
          health.data
            ? `Dernier calcul : ${formatDateTime(health.data.generatedAt)}.`
            : 'Les entreprises et les comptes qui demandent votre attention.'
        }
        actions={
          <button type="button" className="btn btn--ghost" onClick={health.reload} disabled={health.loading}>
            <RotateCw size={16} aria-hidden="true" /> Actualiser
          </button>
        }
      />

      {health.error && <ErrorNote error={health.error} onRetry={health.reload} />}
      {!health.data && !health.error && <Skeleton lines={8} />}

      {health.data && (
        <div className={`alerts ${health.loading ? 'is-stale' : ''}`}>
          {ALERTS.map((a) => {
            const alert = health.data[a.key];
            const clear = alert.count === 0;
            return (
              <section key={a.key} className={`alert ${clear ? 'alert--clear' : ''}`} aria-labelledby={`${a.key}-t`}>
                <header className="alert__head">
                  {clear ? (
                    <CircleCheck size={20} className="alert__icon alert__icon--ok" aria-hidden="true" />
                  ) : (
                    <TriangleAlert size={20} className="alert__icon" aria-hidden="true" />
                  )}
                  <h2 id={`${a.key}-t`} className="alert__title">
                    {a.title}
                  </h2>
                  <span className="alert__count">{formatInt(alert.count)}</span>
                </header>
                <p className="alert__rule">Critère : {alert.threshold.toLowerCase()}.</p>
                {clear ? (
                  <p className="alert__advice">Rien à signaler.</p>
                ) : (
                  <>
                    <p className="alert__advice">{a.advice}</p>
                    <ul className="alert__list">
                      {alert.sample.map((item) =>
                        a.kind === 'company' ? (
                          <li key={item.id}>
                            <Link to={`/entreprises/${item.id}`}>{item.name}</Link>
                            <span className="muted">inscrite le {formatDate(item.created_at)}</span>
                          </li>
                        ) : (
                          <li key={item.id}>
                            <span className="alert__who">
                              <span className="cell-main">{item.username}</span>
                              <span className="cell-sub">
                                {item.email}, inscrit {formatRelative(item.created_at)}
                              </span>
                            </span>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => setPending({ ...item, is_active: false })}
                            >
                              Activer
                            </button>
                          </li>
                        )
                      )}
                    </ul>
                    {alert.count > alert.sample.length && (
                      <p className="alert__more">
                        Et {formatInt(alert.count - alert.sample.length)} autres.{' '}
                        {a.kind === 'user' ? (
                          <Link to="/utilisateurs">Voir tous les utilisateurs</Link>
                        ) : (
                          <Link to="/entreprises">Voir toutes les entreprises</Link>
                        )}
                      </p>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}

      <UserStatusDialog user={pending} onConfirm={activate} onClose={() => setPending(null)} />
    </div>
  );
}
