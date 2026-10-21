import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Building2, Gauge, HeartPulse, LogOut, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { getKpiHealth } from '../api/admin';

const NAV = [
  { to: '/', label: 'Vue d’ensemble', icon: Gauge, end: true },
  { to: '/entreprises', label: 'Entreprises', icon: Building2 },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/sante', label: 'Santé', icon: HeartPulse, badge: 'health' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    getKpiHealth()
      .then(({ data }) =>
        setAlerts(
          data.dormant_companies.count +
            data.onboarding_incomplete.count +
            data.unverified_users.count
        )
      )
      .catch(() => setAlerts(null));
  }, []);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      <aside className="rail">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            F
          </span>
          <span className="brand__name">
            Fluxio <span className="brand__sub">console</span>
          </span>
        </div>

        <nav className="nav" aria-label="Sections">
          {NAV.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink key={to} to={to} end={end} className="nav__link">
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
              {badge === 'health' && alerts > 0 && (
                <span className="nav__badge" aria-label={`${alerts} alertes`}>
                  {alerts}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="rail__me">
          <div className="rail__who">
            <span className="rail__name">{user?.username}</span>
            <span className="rail__mail">{user?.email}</span>
          </div>
          <button type="button" className="icon-btn" onClick={logout} title="Se déconnecter">
            <LogOut size={18} aria-hidden="true" />
            <span className="sr-only">Se déconnecter</span>
          </button>
        </div>
      </aside>

      <main id="main" className="main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
