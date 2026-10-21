import { useLayoutEffect, useRef, useState } from 'react';
import { formatInt, formatMonth, formatTND } from '../lib/format';

const HEIGHT = 240;
const PAD = { top: 16, right: 8, bottom: 28, left: 64 };

/** Graduations « rondes » pour l'axe vertical */
function niceTicks(max, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const ticks = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

const compact = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

/** Barre à extrémité arrondie (4 px) ancrée à plat sur la ligne de base */
function barPath(x, y, w, h, r = 4) {
  if (h <= 0) return '';
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

/**
 * Histogramme mensuel d'une seule mesure. Le dernier mois est en cours :
 * il est dessiné plus clair pour ne pas être lu comme une chute.
 */
export default function TrendChart({ series, field, money = false, label }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fmt = money ? formatTND : formatInt;
  const values = series.map((s) => Number(s[field]) || 0);
  const ticks = niceTicks(Math.max(...values, 0));
  const top = ticks[ticks.length - 1] || 1;

  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const slot = innerW / series.length;
  const barW = Math.max(4, Math.min(36, slot - 2 * Math.max(2, slot * 0.18)));
  const y = (v) => PAD.top + innerH - (v / top) * innerH;
  const showEvery = slot < 34 ? 2 : 1;

  const hovered = hover !== null ? series[hover] : null;
  const lastIndex = series.length - 1;

  return (
    <div className="chart">
      <div className="chart__toolbar">
        <button
          type="button"
          className="link-btn"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
        >
          {asTable ? 'Voir le graphique' : 'Voir les valeurs en tableau'}
        </button>
      </div>

      {asTable ? (
        <div className="table-wrap">
          <table className="table table--compact">
            <caption className="sr-only">{label}, par mois</caption>
            <thead>
              <tr>
                <th scope="col">Mois</th>
                <th scope="col" className="num">
                  {label}
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((s, i) => (
                <tr key={s.month}>
                  <td>
                    {formatMonth(s.month, true)}
                    {i === lastIndex && <span className="muted"> (en cours)</span>}
                  </td>
                  <td className="num">{fmt(s[field])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart__plot" ref={wrapRef} onMouseLeave={() => setHover(null)}>
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`${label} sur ${series.length} mois`}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line
                  className="chart__grid"
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                />
                <text className="chart__axis" x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end">
                  {money ? compact.format(t) : formatInt(t)}
                </text>
              </g>
            ))}

            {series.map((s, i) => {
              const v = values[i];
              const cx = PAD.left + slot * i + slot / 2;
              const barY = y(v);
              return (
                <g key={s.month}>
                  <path
                    className={[
                      'chart__bar',
                      i === lastIndex && 'chart__bar--partial',
                      hover === i && 'chart__bar--hover',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    d={barPath(cx - barW / 2, barY, barW, PAD.top + innerH - barY)}
                  />
                  {i % showEvery === (lastIndex % showEvery) && (
                    <text className="chart__axis" x={cx} y={HEIGHT - 8} textAnchor="middle">
                      {formatMonth(s.month)}
                    </text>
                  )}
                  {/* zone de survol plus large que la barre */}
                  <rect
                    x={PAD.left + slot * i}
                    y={PAD.top}
                    width={slot}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                  />
                </g>
              );
            })}
            <line
              className="chart__baseline"
              x1={PAD.left}
              x2={width - PAD.right}
              y1={PAD.top + innerH}
              y2={PAD.top + innerH}
            />
          </svg>

          {hovered && (
            <div
              className="tooltip"
              style={{
                left: Math.min(
                  Math.max(PAD.left + slot * hover + slot / 2, 90),
                  width - 90
                ),
                top: Math.max(y(values[hover]) - 12, 0),
              }}
            >
              <span className="tooltip__title">
                {formatMonth(hovered.month, true)}
                {hover === lastIndex && ', en cours'}
              </span>
              <span className="tooltip__value">{fmt(hovered[field])}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
