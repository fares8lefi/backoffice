import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { resendCode, verifyAccount } from '../api/auth';

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  // Étape « code » : compte admin créé mais pas encore activé
  const [step, setStep] = useState('credentials');
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to="/" replace />;

  const email = form.email.trim();

  const run = async (action) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      if (err.code === 'UNVERIFIED') {
        setStep('code');
        setNotice(`Un code d’activation a été envoyé à ${email} lors de la création du compte.`);
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const signIn = async () => {
    await login(email, form.password);
    navigate(location.state?.from || '/', { replace: true });
  };

  const submit = (e) => {
    e.preventDefault();
    run(signIn);
  };

  const submitCode = (e) => {
    e.preventDefault();
    run(async () => {
      await verifyAccount(email, code.trim());
      await signIn();
    });
  };

  const resend = () =>
    run(async () => {
      await resendCode(email);
      setCode('');
      setNotice(`Nouveau code envoyé à ${email}. Il est valable 10 minutes.`);
    });

  const backToCredentials = () => {
    setStep('credentials');
    setCode('');
    setError(null);
    setNotice(null);
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

        {step === 'credentials' ? (
          <>
            <h1 className="login__title">Administration de la plateforme</h1>
            <p className="login__intro">
              Suivez l’activité des entreprises inscrites, corrigez leurs informations et gérez
              l’accès de leurs utilisateurs.
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
          </>
        ) : (
          <>
            <h1 className="login__title">Activez votre accès</h1>
            <p className="login__intro">
              Saisissez le code à 6 chiffres reçu par email pour activer votre compte
              administrateur.
            </p>

            <form className="form" onSubmit={submitCode} noValidate>
              <label className="field">
                <span className="field__label">Code d’activation</span>
                <input
                  className="login__code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
                <span className="field__hint">{email}</span>
              </label>
              {notice && (
                <p className="form-note" role="status">
                  {notice}
                </p>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn btn--primary btn--block"
                disabled={busy || code.length !== 6}
              >
                {busy ? 'Vérification…' : 'Activer et se connecter'}
              </button>
            </form>
            <div className="login__actions">
              <button type="button" className="link-btn" onClick={resend} disabled={busy}>
                Renvoyer le code
              </button>
              <button type="button" className="link-btn" onClick={backToCredentials}>
                Changer de compte
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
