import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Pencil } from 'lucide-react';
import { getCompany, getCompanyKpis, setCompanyActive, setUserActive, updateCompany } from '../api/admin';
import { useAsync } from '../lib/useAsync';
import { useAuth } from '../auth/AuthContext';
import {
  formatDate,
  formatDecimal,
  formatInt,
  formatPct,
  formatRelative,
  formatTND,
} from '../lib/format';
import PeriodPicker from '../components/PeriodPicker';
import UserStatusDialog from '../components/UserStatusDialog';
import { useToast } from '../components/Toast';
import { CompanyStatusDialog } from './CompaniesPage';
import { Delta, Empty, ErrorNote, Skeleton, StatusBadge } from '../components/ui';

const COMPANY_KPIS = [
  { key: 'revenue_billed_ttc', label: 'Facturé TTC', type: 'money' },
  { key: 'revenue_billed_ht', label: 'Facturé HT', type: 'money' },
  { key: 'revenue_collected', label: 'Encaissé', type: 'money' },
  { key: 'collection_rate_pct', label: 'Taux d’encaissement', type: 'pct' },
  { key: 'outstanding_ttc', label: 'Reste à encaisser', type: 'money', invert: true },
  { key: 'invoice_count', label: 'Factures émises', type: 'int' },
  { key: 'average_basket', label: 'Panier moyen', type: 'money' },
  { key: 'margin_estimated', label: 'Marge estimée', type: 'money' },
  { key: 'sales_volume', label: 'Quantités vendues', type: 'dec' },
  { key: 'purchase_total', label: 'Achats', type: 'money' },
  { key: 'stock_value_cost', label: 'Valeur du stock au coût', type: 'money' },
  { key: 'client_count', label: 'Clients', type: 'int' },
];

const formatKpi = (type, v) =>
  ({ money: formatTND, pct: formatPct, int: formatInt, dec: formatDecimal })[type](v);

const COUNTS = [
  ['products', 'produits'],
  ['invoices', 'factures'],
  ['movements', 'mouvements de stock'],
  ['clients', 'clients'],
  ['suppliers', 'fournisseurs'],
];

export default function CompanyPage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const notify = useToast();
  const [period, setPeriod] = useState({ period: 'month' });
  const [editing, setEditing] = useState(false);
  const [statusPending, setStatusPending] = useState(null);
  const [userPending, setUserPending] = useState(null);

  const detail = useAsync(() => getCompany(id).then((r) => r.company), [id]);
  const kpis = useAsync(() => getCompanyKpis(id, period).then((r) => r.data), [id, period]);

  if (detail.error) {
    return (
      <div className="page">
        <BackLink />
        <ErrorNote error={detail.error} onRetry={detail.error.status === 404 ? null : detail.reload} />
      </div>
    );
  }
  if (!detail.data) {
    return (
      <div className="page">
        <BackLink />
        <Skeleton lines={8} />
      </div>
    );
  }

  const c = detail.data;

  const toggleCompany = async () => {
    const res = await setCompanyActive(c.id, !c.is_active);
    detail.mutate((d) => ({ ...d, is_active: res.company.is_active }));
    notify(res.message);
  };

  const toggleUser = async () => {
    const res = await setUserActive(userPending.id, !userPending.is_active);
    detail.mutate((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === res.user.id ? { ...u, is_active: res.user.is_active } : u)),
    }));
    notify(res.message);
  };

  return (
    <div className="page">
      <BackLink />
      <header className="page-header">
        <div>
          <h1 className="page-title">{c.name}</h1>
          <p className="page-intro">
            Inscrite le {formatDate(c.created_at)}. <StatusBadge active={c.is_active} />
          </p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className={`btn ${c.is_active ? 'btn--ghost-danger' : 'btn--primary'}`}
            onClick={() => setStatusPending({ company: c })}
          >
            {c.is_active ? 'Suspendre l’entreprise' : 'Réactiver l’entreprise'}
          </button>
        </div>
      </header>

      <div className="split split--even">
        <section className="panel" aria-labelledby="info-title">
          <div className="panel__head">
            <h2 id="info-title" className="section__title">
              Informations générales
            </h2>
            {!editing && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>
                <Pencil size={14} aria-hidden="true" /> Modifier
              </button>
            )}
          </div>
          {editing ? (
            <CompanyForm
              company={c}
              onCancel={() => setEditing(false)}
              onSaved={(updated, message) => {
                detail.mutate((d) => ({ ...d, ...updated }));
                setEditing(false);
                notify(message);
              }}
            />
          ) : (
            <dl className="ledger">
              <div>
                <dt>Raison sociale</dt>
                <dd>{c.name}</dd>
              </div>
              <div>
                <dt>Matricule fiscal</dt>
                <dd>{c.matriculeFiscale || <span className="muted">Non renseigné</span>}</dd>
              </div>
              <div>
                <dt>Adresse</dt>
                <dd>{c.address || <span className="muted">Non renseignée</span>}</dd>
              </div>
              <div>
                <dt>Téléphone</dt>
                <dd>{c.phone || <span className="muted">Non renseigné</span>}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="panel" aria-labelledby="content-title">
          <h2 id="content-title" className="section__title">
            Contenu du compte
          </h2>
          <ul className="counts">
            {COUNTS.map(([key, label]) => (
              <li key={key}>
                <span className="counts__value">{formatInt(c._count?.[key])}</span> {label}
              </li>
            ))}
          </ul>
          <p className="panel__note">
            Le catalogue, le stock et la facturation restent gérés par l’entreprise elle-même.
          </p>
        </section>
      </div>

      <section className="panel" aria-labelledby="kpi-title">
        <div className="panel__head">
          <h2 id="kpi-title" className="section__title">
            Pilotage
          </h2>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
        {kpis.error && <ErrorNote error={kpis.error} onRetry={kpis.reload} />}
        {!kpis.data && !kpis.error && <Skeleton lines={4} />}
        {kpis.data && (
          <>
            <p className="panel__note">{kpis.data.period.label}</p>
            <dl className={`figures ${kpis.loading ? 'is-stale' : ''}`}>
              {COMPANY_KPIS.map((f) => {
                const item = kpis.data.kpis[f.key];
                if (!item) return null;
                return (
                  <div key={f.key} className="figures__item">
                    <dt>{f.label}</dt>
                    <dd>
                      <span className="figures__value">{formatKpi(f.type, item.value)}</span>
                      {item.previous !== null && <Delta pct={item.delta_pct} invert={f.invert} />}
                    </dd>
                  </div>
                );
              })}
            </dl>
            {kpis.data.kpis.margin_estimated_note && (
              <p className="panel__note">Marge estimée : {kpis.data.kpis.margin_estimated_note.toLowerCase()}.</p>
            )}
          </>
        )}
      </section>

      <section className="panel panel--flush" aria-labelledby="users-title">
        <div className="panel__head panel__head--pad">
          <h2 id="users-title" className="section__title">
            Utilisateurs ({c.users.length})
          </h2>
        </div>
        {c.users.length === 0 ? (
          <Empty title="Aucun utilisateur rattaché">
            Les membres invités par le gérant apparaîtront ici.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Utilisateur</th>
                  <th scope="col">Rôle</th>
                  <th scope="col">Dernière connexion</th>
                  <th scope="col">Inscrit le</th>
                  <th scope="col">Statut</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {c.users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="cell-main">{u.username}</span>
                      <span className="cell-sub">{u.email}</span>
                    </td>
                    <td>{u.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</td>
                    <td title={u.last_login ? formatDate(u.last_login) : undefined}>
                      {formatRelative(u.last_login)}
                    </td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      <StatusBadge active={u.is_active} on="Actif" off="Inactif" />
                    </td>
                    <td className="actions">
                      {u.id !== me?.id && (
                        <button
                          type="button"
                          className={`btn btn--sm ${u.is_active ? 'btn--ghost-danger' : 'btn--ghost'}`}
                          onClick={() => setUserPending(u)}
                        >
                          {u.is_active ? 'Suspendre' : 'Activer'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CompanyStatusDialog
        pending={statusPending}
        onConfirm={toggleCompany}
        onClose={() => setStatusPending(null)}
      />
      <UserStatusDialog user={userPending} onConfirm={toggleUser} onClose={() => setUserPending(null)} />
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/entreprises" className="back-link">
      <ChevronLeft size={16} aria-hidden="true" /> Toutes les entreprises
    </Link>
  );
}

const FIELDS = [
  { key: 'name', label: 'Raison sociale', required: true, autoComplete: 'organization' },
  { key: 'matriculeFiscale', label: 'Matricule fiscal', hint: 'Exemple : 1234567/A/M/000' },
  { key: 'address', label: 'Adresse', autoComplete: 'street-address' },
  { key: 'phone', label: 'Téléphone', type: 'tel', autoComplete: 'tel' },
];

function CompanyForm({ company, onCancel, onSaved }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, company[f.key] ?? '']))
  );
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setError('La raison sociale est obligatoire.');
      return;
    }
    // N'envoyer que les champs modifiés
    const changes = {};
    for (const f of FIELDS) {
      const next = values[f.key].trim();
      if (next !== (company[f.key] ?? '')) changes[f.key] = next;
    }
    if (Object.keys(changes).length === 0) {
      onCancel();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await updateCompany(company.id, changes);
      onSaved(res.company, res.message);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      {FIELDS.map((f) => (
        <label key={f.key} className="field">
          <span className="field__label">{f.label}</span>
          <input
            type={f.type || 'text'}
            value={values[f.key]}
            autoComplete={f.autoComplete}
            required={f.required}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
          />
          {f.hint && <span className="field__hint">{f.hint}</span>}
        </label>
      ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Annuler
        </button>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
