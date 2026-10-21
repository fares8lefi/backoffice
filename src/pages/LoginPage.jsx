import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="login">
      <div className="login__panel">
        <div className="brand brand--large">
          <span className="brand__mark" aria-hidden="true">
            F
          </span>
          <span className="brand__name">
            Fluxio <span className="brand__sub">console</span>
          </span>
        </div>
        <h1 className="login__title">Administration de la plateforme</h1>
        <p className="login__intro">
          Suivez l’activité des entreprises inscrites, corrigez leurs informations et gérez l’accès
          de leurs utilisateurs.
        </p>

        <form className="form" onSubmit={submit} noValidate>
          <label className="field">
            <span className="field__label">Email</span>
            <input
              type="email"
              autoComplete="username"
              value={form.email}
              onChange={set('email')}
              required
              autoFocus
            />
          </label>
          <label className="field">
            <span className="field__label">Mot de passe</span>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={set('password')}
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={busy || !form.email || !form.password}
          >
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="login__foot">Accès réservé aux comptes dont le rôle est administrateur.</p>
      </div>
    </div>
  );
}
