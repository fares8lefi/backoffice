import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getCompanies, getPlatformStats, setCompanyActive } from '../api/admin';
import { useAsync } from '../lib/useAsync';
import { formatDate, formatInt } from '../lib/format';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { Empty, ErrorNote, PageHeader, Pagination, Skeleton, StatusBadge } from '../components/ui';

const LIMIT = 20;

export default function CompaniesPage() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const search = params.get('q') || '';
  const [query, setQuery] = useState(search);
  const [pending, setPending] = useState(null);
  const notify = useToast();

  // Recherche lancée 300 ms après la dernière frappe
  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim() === search) return;
      const next = new URLSearchParams();
      if (query.trim()) next.set('q', query.trim());
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [query, search, setParams]);

  const stats = useAsync(() => getPlatformStats().then((r) => r.stats), []);
  const list = useAsync(() => getCompanies({ page, limit: LIMIT, search }), [page, search]);

  const goTo = (p) => {
    const next = new URLSearchParams(params);
    next.set('page', String(p));
    setParams(next);
  };

  const toggle = async () => {
    const { company } = pending;
    const res = await setCompanyActive(company.id, !company.is_active);
    list.mutate((d) => ({
      ...d,
      companies: d.companies.map((c) =>
        c.id === company.id ? { ...c, is_active: res.company.is_active } : c
      ),
    }));
    stats.reload();
    notify(res.message);
  };

  const s = stats.data;

  return (
    <div className="page">
      <PageHeader
        title="Entreprises"
        intro={
          s
            ? `${formatInt(s.totalCompanies)} inscrites, ${formatInt(s.activeCompanies)} actives et ${formatInt(s.suspendedCompanies)} suspendues. ${formatInt(s.newCompaniesThisMonth)} nouvelles ce mois-ci.`
            : 'Toutes les entreprises inscrites sur Fluxio.'
        }
      />

      <div className="toolbar">
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Rechercher une entreprise</span>
          <input
            type="search"
            placeholder="Rechercher par nom"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <section className="panel panel--flush">
        {list.error && <ErrorNote error={list.error} onRetry={list.reload} />}
        {!list.data && !list.error && <Skeleton lines={8} />}
        {list.data && list.data.companies.length === 0 && (
          <Empty title={search ? `Aucune entreprise ne contient « ${search} »` : 'Aucune entreprise inscrite'}>
            {search
              ? 'Vérifiez l’orthographe ou effacez la recherche.'
              : 'Les entreprises apparaissent ici dès leur inscription sur Fluxio.'}
          </Empty>
        )}
        {list.data && list.data.companies.length > 0 && (
          <div className={`table-wrap ${list.loading ? 'is-stale' : ''}`}>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Entreprise</th>
                  <th scope="col">Inscrite le</th>
                  <th scope="col" className="num">
                    Utilisateurs
                  </th>
                  <th scope="col" className="num">
                    Produits
                  </th>
                  <th scope="col" className="num">
                    Factures
                  </th>
                  <th scope="col" className="num">
                    Mouvements
                  </th>
                  <th scope="col">Statut</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.data.companies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link className="row-link" to={`/entreprises/${c.id}`}>
                        {c.name}
                      </Link>
                      <span className="cell-sub">{c.matriculeFiscale || 'Matricule fiscal manquant'}</span>
                    </td>
                    <td>{formatDate(c.created_at)}</td>
                    <td className="num">{formatInt(c._count?.users)}</td>
                    <td className="num">{formatInt(c._count?.products)}</td>
                    <td className="num">{formatInt(c._count?.invoices)}</td>
                    <td className="num">{formatInt(c._count?.movements)}</td>
                    <td>
                      <StatusBadge active={c.is_active} />
                    </td>
                    <td className="actions">
                      <button
                        type="button"
                        className={`btn btn--sm ${c.is_active ? 'btn--ghost-danger' : 'btn--ghost'}`}
                        onClick={() => setPending({ company: c })}
                      >
                        {c.is_active ? 'Suspendre' : 'Réactiver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {list.data && list.data.companies.length > 0 && (
          <Pagination
            page={list.data.page}
            totalPages={list.data.totalPages}
            total={list.data.total}
            onChange={goTo}
            noun="entreprises"
          />
        )}
      </section>

      <CompanyStatusDialog pending={pending} onConfirm={toggle} onClose={() => setPending(null)} />
    </div>
  );
}

export function CompanyStatusDialog({ pending, onConfirm, onClose }) {
  const company = pending?.company;
  const suspending = company?.is_active;
  return (
    <ConfirmDialog
      open={Boolean(company)}
      title={suspending ? `Suspendre ${company?.name} ?` : `Réactiver ${company?.name} ?`}
      confirmLabel={suspending ? 'Suspendre l’entreprise' : 'Réactiver l’entreprise'}
      tone={suspending ? 'danger' : 'default'}
      onConfirm={onConfirm}
      onClose={onClose}
    >
      {suspending ? (
        <p>
          L’entreprise sera marquée comme suspendue. Ses données sont conservées et vous pourrez la
          réactiver à tout moment. Pour couper l’accès d’une personne, suspendez aussi son compte
          utilisateur.
        </p>
      ) : (
        <p>L’entreprise sera de nouveau marquée comme active.</p>
      )}
    </ConfirmDialog>
  );
}
