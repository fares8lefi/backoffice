import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import { deleteUser, getAllUsers, getCompanies, setUserActive } from '../api/admin';
import { useAsync } from '../lib/useAsync';
import { useAuth } from '../auth/AuthContext';
import { formatDate, formatInt, formatRelative } from '../lib/format';
import ConfirmDialog from '../components/ConfirmDialog';
import UserStatusDialog from '../components/UserStatusDialog';
import { useToast } from '../components/Toast';
import { Empty, ErrorNote, PageHeader, Pagination, Skeleton, StatusBadge } from '../components/ui';

const PER_PAGE = 25;

const FILTERS = [
  { key: 'all', label: 'Tous', test: () => true },
  { key: 'active', label: 'Actifs', test: (u) => u.is_active },
  { key: 'inactive', label: 'Inactifs', test: (u) => !u.is_active },
  { key: 'never', label: 'Jamais connectés', test: (u) => !u.last_login },
  { key: 'admin', label: 'Administrateurs', test: (u) => u.role === 'admin' },
];

const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export default function UsersPage() {
  const { user: me } = useAuth();
  const notify = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [statusPending, setStatusPending] = useState(null);
  const [deletePending, setDeletePending] = useState(null);

  const users = useAsync(() => getAllUsers().then((r) => r.users), []);
  // Noms des entreprises pour la colonne « Entreprise » (l'API users ne renvoie que l'id)
  const companies = useAsync(
    () =>
      getCompanies({ page: 1, limit: 1000 }).then(
        (r) => new Map(r.companies.map((c) => [c.id, c.name]))
      ),
    []
  );

  const rows = useMemo(() => {
    if (!users.data) return [];
    const q = normalize(query.trim());
    const test = FILTERS.find((f) => f.key === filter).test;
    return users.data
      .filter(test)
      .filter((u) => {
        if (!q) return true;
        const company = companies.data?.get(u.companyId);
        return [u.username, u.email, u.phone, company].some((v) => normalize(v).includes(q));
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [users.data, companies.data, query, filter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const counts = useMemo(() => {
    const list = users.data || [];
    return Object.fromEntries(FILTERS.map((f) => [f.key, list.filter(f.test).length]));
  }, [users.data]);

  const toggle = async () => {
    const res = await setUserActive(statusPending.id, !statusPending.is_active);
    users.mutate((list) =>
      list.map((u) => (u.id === res.user.id ? { ...u, is_active: res.user.is_active } : u))
    );
    notify(res.message);
  };

  const remove = async () => {
    const res = await deleteUser(deletePending.id);
    users.mutate((list) => list.filter((u) => u.id !== deletePending.id));
    notify(res.message || 'Utilisateur supprimé');
  };

  return (
    <div className="page">
      <PageHeader
        title="Utilisateurs"
        intro={
          users.data
            ? `${formatInt(counts.all)} comptes, dont ${formatInt(counts.inactive)} inactifs (suspendus ou jamais vérifiés).`
            : 'Tous les comptes de la plateforme.'
        }
      />

      <div className="toolbar">
        <label className="search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Rechercher un utilisateur</span>
          <input
            type="search"
            placeholder="Nom, email, téléphone ou entreprise"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <div className="segmented segmented--small" role="radiogroup" aria-label="Filtrer">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="radio"
              aria-checked={filter === f.key}
              className="segmented__item"
              onClick={() => {
                setFilter(f.key);
                setPage(1);
              }}
            >
              {f.label}
              {users.data && <span className="segmented__count">{formatInt(counts[f.key])}</span>}
            </button>
          ))}
        </div>
      </div>

      <section className="panel panel--flush">
        {users.error && <ErrorNote error={users.error} onRetry={users.reload} />}
        {!users.data && !users.error && <Skeleton lines={10} />}
        {users.data && rows.length === 0 && (
          <Empty title="Aucun utilisateur ne correspond">
            Modifiez la recherche ou choisissez un autre filtre.
          </Empty>
        )}
        {visible.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Utilisateur</th>
                  <th scope="col">Entreprise</th>
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
                {visible.map((u) => {
                  const isMe = u.id === me?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <span className="cell-main">
                          {u.username}
                          {isMe && <span className="muted"> (vous)</span>}
                        </span>
                        <span className="cell-sub">{u.email}</span>
                      </td>
                      <td>
                        {u.companyId ? (
                          <Link to={`/entreprises/${u.companyId}`}>
                            {companies.data?.get(u.companyId) || 'Voir l’entreprise'}
                          </Link>
                        ) : (
                          <span className="muted">Aucune</span>
                        )}
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
                        {!isMe && (
                          <>
                            <button
                              type="button"
                              className={`btn btn--sm ${u.is_active ? 'btn--ghost-danger' : 'btn--ghost'}`}
                              onClick={() => setStatusPending(u)}
                            >
                              {u.is_active ? 'Suspendre' : 'Activer'}
                            </button>
                            <button
                              type="button"
                              className="icon-btn icon-btn--danger"
                              onClick={() => setDeletePending(u)}
                              title={`Supprimer ${u.username}`}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                              <span className="sr-only">Supprimer {u.username}</span>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {users.data && rows.length > 0 && (
          <Pagination
            page={current}
            totalPages={totalPages}
            total={rows.length}
            onChange={setPage}
            noun="utilisateurs"
          />
        )}
      </section>

      <UserStatusDialog user={statusPending} onConfirm={toggle} onClose={() => setStatusPending(null)} />
      <ConfirmDialog
        open={Boolean(deletePending)}
        title={`Supprimer le compte de ${deletePending?.username} ?`}
        confirmLabel="Supprimer définitivement"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeletePending(null)}
      >
        <p>
          Le compte {deletePending?.email} sera effacé. Cette action est irréversible. Pour
          seulement bloquer l’accès, suspendez plutôt le compte.
        </p>
      </ConfirmDialog>
    </div>
  );
}
