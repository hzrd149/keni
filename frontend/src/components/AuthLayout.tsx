import logoLightSrc from '../assets/logo.svg';
import logoDarkSrc from '../assets/logo-white.svg';
import { useTheme } from '../lib/theme';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'grid',
      placeItems: 'center',
      padding: '64px 24px 40px',
      background: 'var(--cream)',
    }}>
      <main style={{
        width: '100%',
        maxWidth: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        animation: 'fadeIn 0.3s ease both',
      }}>
        {children}
      </main>
    </div>
  );
}

export function AuthHeader({ title, subtitle, clientName }: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  clientName?: string;
}) {
  const logoSrc = useTheme() === 'dark' ? logoDarkSrc : logoLightSrc;
  const logo = <img src={logoSrc} alt="Keni" width="44" height="44" style={{ display: 'block' }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        {clientName && (
          <>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              display: 'grid',
              placeItems: 'center',
              background: 'var(--cream-dark)',
              border: '1px solid var(--cream-darker)',
              fontFamily: 'var(--font-display)',
              fontSize: 25,
              color: 'var(--ink)',
            }}>
              {clientName.charAt(0).toUpperCase()}
            </div>
            <span style={{ width: 34, borderTop: '1.5px dashed var(--sand)' }} />
          </>
        )}
        {logo}
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 34, lineHeight: 1.1, color: 'var(--ink)' }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: 14, color: 'var(--ink-light)' }}>{subtitle}</p>}
    </div>
  );
}
