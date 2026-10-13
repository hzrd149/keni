import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ui/Toast';
import { users } from '../lib/api';
import type { UserResponse } from '../lib/types';
import { AuthHeader, AuthLayout } from '../components/AuthLayout';

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

type Mode = 'loading' | 'logged-in' | 'login-required' | 'denied' | 'error';

export function OAuthAuthorizePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const state = searchParams.get('state') ?? '';
  const clientName = searchParams.get('client_name') ?? 'An application';
  const scopesRaw = searchParams.get('scopes') ?? 'user';

  const [mode, setMode] = useState<Mode>('loading');
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!state) {
      setMode('error');
      return;
    }
    const token = getAccessToken();
    if (!token) {
      setMode('login-required');
      return;
    }
    users.me()
      .then((u) => {
        setCurrentUser(u);
        setMode('logged-in');
      })
      .catch(() => {
        setMode('login-required');
      });
  }, [state]);

  const handleApproveWithSession = async () => {
    setSubmitting(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${BASE}/oauth/approve/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ state }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? t('oauth.authFailed'));
      }
      const { redirect_uri } = await res.json();
      window.location.href = redirect_uri;
    } catch (err) {
      toast(err instanceof Error ? err.message : t('oauth.authFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveWithCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/oauth/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? t('oauth.invalidCredentials'));
      }
      const { redirect_uri } = await res.json();
      window.location.href = redirect_uri;
    } catch (err) {
      toast(err instanceof Error ? err.message : t('oauth.authFailed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const scopeLabels: Record<string, string> = {
    user: t('oauth.scopeUser'),
  };
  const scopes = scopesRaw.split(' ').filter(Boolean);

  const requesting = (
    <><strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{clientName}</strong> is requesting access to your Keni account.</>
  );

  const permissions = (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--cream-darker)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {t('oauth.permissionsRequested')}
      </p>
      {scopes.map((s) => (
        <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, marginTop: 7 }} />
          <span style={{ fontSize: 13, color: 'var(--ink-mid)' }}>
            {scopeLabels[s] ?? s}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <AuthLayout>
      {mode === 'loading' && (
        <p style={{ color: 'var(--ink-light)', fontSize: 14, textAlign: 'center' }}>{t('oauth.loading')}</p>
      )}

      {mode === 'error' && (
        <AuthHeader title={t('oauth.errorTitle')} subtitle={t('oauth.errorDesc')} />
      )}

      {mode === 'denied' && (
        <AuthHeader
          clientName={clientName}
          title={t('oauth.deniedTitle')}
          subtitle={<>You denied access to <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{clientName}</strong>. You can close this window.</>}
        />
      )}

      {mode === 'logged-in' && currentUser && (
        <>
          <AuthHeader
            clientName={clientName}
            title={<>Hi, {currentUser.display_name ?? currentUser.username}</>}
            subtitle={requesting}
          />

          {permissions}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleApproveWithSession}
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting && <span className="btn-spinner" />}
              {t('oauth.authorize')}
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => setMode('denied')}
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {t('oauth.deny')}
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => { setCurrentUser(null); setMode('login-required'); }}
              style={{ fontSize: 13, color: 'var(--ink-light)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--sand)', textUnderlineOffset: 3 }}
            >
              {t('oauth.notYou')}
            </button>
          </div>
        </>
      )}

      {mode === 'login-required' && (
        <>
          <AuthHeader clientName={clientName} title={t('oauth.signInTitle')} subtitle={requesting} />

          {permissions}

          <form onSubmit={handleApproveWithCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                autoComplete="current-password"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting}
                style={{ width: '100%' }}
              >
                {submitting && <span className="btn-spinner" />}
                {t('oauth.signInAuthorize')}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => setMode('denied')}
                disabled={submitting}
                style={{ width: '100%' }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
