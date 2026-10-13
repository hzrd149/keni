import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { AuthHeader, AuthLayout } from '../components/AuthLayout';

export function LoginPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await signup(username, password, displayName || undefined);
      }
      navigate('/');
    } catch (err) {
      toast(err instanceof Error ? err.message : t('login.errorGeneric'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader
        title={mode === 'login' ? t('login.titleLogin') : t('login.titleSignup')}
        subtitle={mode === 'login' ? t('login.subtitleLogin') : t('login.subtitleSignup')}
      />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {mode === 'signup' && (
          <div className="input-group">
            <label className="input-label">{t('login.displayNameLabel')}</label>
            <input
              className="input"
              type="text"
              placeholder={t('login.displayNamePlaceholder')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}

        <div className="input-group">
          <label className="input-label">{t('login.usernameLabel')}</label>
          <input
            className="input"
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className="input-group">
          <label className="input-label">{t('login.passwordLabel')}</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
          style={{ marginTop: 4, width: '100%' }}
        >
          {loading && <span className="btn-spinner" />}
          {mode === 'login' ? t('login.submitLogin') : t('login.submitSignup')}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--ink-light)' }}>
        {mode === 'login' ? t('login.noAccount') : t('login.haveAccount')}{' '}
        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          style={{ color: 'var(--ink)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline', textDecorationColor: 'var(--sand)', textUnderlineOffset: 3 }}
        >
          {mode === 'login' ? t('login.signUp') : t('login.signIn')}
        </button>
      </div>
    </AuthLayout>
  );
}
