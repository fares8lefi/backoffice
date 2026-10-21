import { useState } from 'react';

const OPTIONS = [
  { key: 'month', label: 'Ce mois' },
  { key: '30d', label: '30 jours' },
  { key: 'prev_month', label: 'Mois dernier' },
  { key: 'year', label: 'Cette année' },
  { key: 'custom', label: 'Dates…' },
];

const today = () => new Date().toISOString().slice(0, 10);

/** Sélecteur de période partagé par tous les KPI (clés de l'API : month, 30d…) */
export default function PeriodPicker({ value, onChange }) {
  const [draft, setDraft] = useState({
    startDate: value.startDate || today().slice(0, 8) + '01',
    endDate: value.endDate || today(),
  });

  const pick = (key) => {
    if (key === 'custom') onChange({ period: 'custom', ...draft });
    else onChange({ period: key });
  };

  const applyDates = (e) => {
    e.preventDefault();
    onChange({ period: 'custom', ...draft });
  };

  return (
    <div className="period">
      <div className="segmented" role="radiogroup" aria-label="Période">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={value.period === o.key}
            className="segmented__item"
            onClick={() => pick(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {value.period === 'custom' && (
        <form className="period__dates" onSubmit={applyDates}>
          <label>
            Du
            <input
              type="date"
              value={draft.startDate}
              max={draft.endDate}
              onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
              required
            />
          </label>
          <label>
            au
            <input
              type="date"
              value={draft.endDate}
              min={draft.startDate}
              onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
              required
            />
          </label>
          <button type="submit" className="btn btn--ghost btn--sm">
            Appliquer
          </button>
        </form>
      )}
    </div>
  );
}
