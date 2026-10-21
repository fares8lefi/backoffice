import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { formatDecimal } from '../lib/format';

/** Variation en % par rapport à la période précédente. Le signe et la flèche portent le sens. */
export function Delta({ pct, invert = false }) {
  if (pct === null || pct === undefined) {
    return <span className="delta delta--none">pas de point de comparaison</span>;
  }
  const value = Number(pct);
  if (value === 0) return <span className="delta delta--flat">stable</span>;
  const up = value > 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`delta ${good ? 'delta--good' : 'delta--bad'}`}>
      <Icon size={14} aria-hidden="true" />
      {up ? '+' : '−'}
      {formatDecimal(Math.abs(value))} %
    </span>
  );
}

export function StatusBadge({ active, on = 'Active', off = 'Suspendue' }) {
  return (
    <span className={`status ${active ? 'status--on' : 'status--off'}`}>
      <span className="status__dot" aria-hidden="true" />
      {active ? on : off}
    </span>
  );
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="note note--error" role="alert">
      <p>{error.message}</p>
      {onRetry && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
          <RotateCw size={14} aria-hidden="true" /> Réessayer
        </button>
      )}
    </div>
  );
}

export function Skeleton({ lines = 3, tall = false }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className={tall ? 'skeleton__bar skeleton__bar--tall' : 'skeleton__bar'} />
      ))}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {children && <p className="empty__text">{children}</p>}
    </div>
  );
}

export function Pagination({ page, totalPages, total, onChange, noun = 'résultats' }) {
  if (!totalPages || totalPages <= 1) {
    return <p className="pagination__info">{total} {noun}</p>;
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <p className="pagination__info">
        Page {page} sur {totalPages}, {total} {noun}
      </p>
      <div className="pagination__buttons">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={16} aria-hidden="true" /> Précédente
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
        >
          Suivante <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export function PageHeader({ title, intro, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {intro && <p className="page-intro">{intro}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
