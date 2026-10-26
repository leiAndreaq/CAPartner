import { useState } from 'react';
import { Icon } from '@iconify/react';

const capLogo = new URL('../assets/CAP LOGO.png', import.meta.url).href;
const accountMale = new URL('../assets/Account Male.png', import.meta.url).href;

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div
      className="login-shell min-h-screen w-screen flex items-center justify-center p-6 box-border font-sans"
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at top, rgba(34,197,94,0.18), transparent 30%), linear-gradient(135deg, #041d10 0%, #082d1b 32%, #0d2e1b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        className="login-card flex flex-col md:flex-row w-full max-w-[960px] min-h-[540px] rounded-[30px] p-3 box-border"
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          maxWidth: '960px',
          minHeight: '540px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(242,250,245,0.96))',
          borderRadius: '30px',
          padding: '12px',
          boxShadow: '0 28px 70px rgba(2, 18, 11, 0.32)',
          border: '1px solid rgba(15, 64, 38, 0.06)',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="login-form-panel flex-1 p-8 md:px-10 md:py-8 flex flex-col justify-between"
          style={{
            flex: 1,
            padding: '32px 38px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.75)',
            borderRadius: '24px 0 0 24px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div>
            <div className="text-center mb-2" style={{ textAlign: 'center', marginBottom: '10px' }}>
              <img
                src={accountMale}
                alt="Account Male"
                className="w-[82px] h-[82px] object-contain block mx-auto select-none pointer-events-none"
                style={{
                  width: '84px',
                  height: '84px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 10px 24px rgba(11, 45, 29, 0.12))',
                }}
              />
            </div>

            <h2
              className="text-3xl md:text-4xl font-extrabold text-center mb-1 tracking-tight"
              style={{
                fontSize: '2.15rem',
                fontWeight: 900,
                color: '#0d2a1a',
                textAlign: 'center',
                margin: '0 0 6px 0',
                letterSpacing: '-0.05em',
              }}
            >
              LOGIN
            </h2>
            <p
              className="text-xs md:text-sm text-slate-800 text-center mb-6"
              style={{
                fontSize: '0.8rem',
                color: '#475569',
                textAlign: 'center',
                margin: '0 0 26px 0',
                fontWeight: 600,
              }}
            >
              Sign in to access the CAPartner Admin Dashboard.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4" style={{ marginBottom: '18px' }}>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#0c2d1d',
                    marginBottom: '8px',
                    letterSpacing: '0.02em',
                  }}
                >
                  Admin Username
                </label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white text-sm font-semibold text-slate-800 outline-none box-border"
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    borderRadius: '14px',
                    border: '1.5px solid rgba(12, 45, 29, 0.18)',
                    backgroundColor: '#ffffff',
                    boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.06)',
                    fontSize: '0.96rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>

              <div className="mb-4" style={{ marginBottom: '18px' }}>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#0c2d1d',
                    marginBottom: '8px',
                    letterSpacing: '0.02em',
                  }}
                >
                  Password
                </label>
                <div
                  className="relative"
                  style={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-3 pl-4 pr-11 rounded-lg bg-white text-sm font-semibold text-slate-800 outline-none box-border"
                    style={{
                      width: '100%',
                      padding: '13px 44px 13px 16px',
                      borderRadius: '14px',
                      border: '1.5px solid rgba(12, 45, 29, 0.18)',
                      backgroundColor: '#ffffff',
                      boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.06)',
                      fontSize: '0.96rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute bg-transparent border-none cursor-pointer p-0 flex items-center justify-center"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0d2a1a',
                      width: '22px',
                      height: '22px',
                      zIndex: 2,
                      lineHeight: 0,
                    }}
                  >
                    <Icon
                      icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'}
                      width="22"
                      height="22"
                      style={{ display: 'block' }}
                    />
                  </button>
                </div>
              </div>

              <div
                className="flex justify-between items-center mb-5 text-xs font-semibold"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                <label
                  className="flex items-center gap-1.5 text-slate-800 cursor-pointer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#1f2937',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="cursor-pointer"
                    style={{ accentColor: '#0d2a1a' }}
                  />
                  Remember me
                </label>
                <a
                  href="#forgot"
                  className="no-underline font-bold hover:underline"
                  style={{
                    color: '#0d2a1a',
                    textDecoration: 'none',
                    fontWeight: 800,
                  }}
                >
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full py-3 text-white border-none rounded-lg font-extrabold text-sm cursor-pointer tracking-wider transition-colors"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #0d6d3d 0%, #10a75d 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                  boxShadow: '0 18px 30px rgba(16, 167, 93, 0.24)',
                }}
              >
                LOGIN
              </button>
            </form>
          </div>

          <div
            className="flex justify-between items-center pt-5 text-[11px] font-bold text-slate-800"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '18px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#334155',
              gap: '8px',
            }}
          >
            <div className="flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon
                icon="bi:shield-lock-fill"
                className="w-5.5 h-5.5"
                style={{
                  width: '22px',
                  height: '22px',
                  color: '#0d6d3d',
                }}
              />
              Secure connection
            </div>
            <div className="flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon
                icon="bxs:check-shield"
                className="w-6 h-6"
                style={{
                  width: '24px',
                  height: '24px',
                  color: '#0d6d3d',
                }}
              />
              2-step verification required
            </div>
          </div>
        </div>

        <div
          className="login-brand-panel flex-1 p-6 flex flex-col items-center justify-center text-center rounded-b-[20px] md:rounded-bl-none md:rounded-r-[20px] box-border"
          style={{
            flex: 1,
            background: 'linear-gradient(180deg, rgba(4, 26, 16, 1), rgba(4, 18, 12, 1))',
            padding: '26px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderRadius: '0 24px 24px 0',
            boxSizing: 'border-box',
            boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.04)',
          }}
        >
          <div className="mb-4" style={{ marginBottom: '16px' }}>
            <div
              className="px-5 py-2 rounded-full text-emerald-500 text-[11px] font-extrabold tracking-wider inline-flex items-center gap-1.5"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '8px 18px',
                borderRadius: '999px',
                color: '#a7f3d0',
                fontSize: '0.67rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(167,243,208,0.1)',
              }}
            >
              SMART CAP MONITORING CONSOLE
            </div>
          </div>

          <div className="flex justify-center mb-0 desktop-brand-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0px' }}>
            <img
              src={capLogo}
              alt="CAPartner Logo"
              className="w-[280px] h-auto block select-none pointer-events-none"
              style={{
                width: '280px',
                height: 'auto',
                display: 'block',
                userSelect: 'none',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 18px 18px rgba(0,0,0,0.28))',
              }}
            />
          </div>

          <div className="-mt-4" style={{ marginTop: '-18px' }}>
            <h1
              className="text-white text-5xl font-black mb-1 leading-tight tracking-tight"
              style={{
                color: '#ffffff',
                fontSize: '3rem',
                fontWeight: 900,
                margin: '0 0 6px 0',
                lineHeight: 1.08,
                letterSpacing: '-0.04em',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              CAPartner
            </h1>
            <p
              className="text-white text-sm font-normal opacity-90"
              style={{
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 500,
                margin: 0,
                opacity: 0.9,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              CAPartner sa kalusugan, CAPartner sa kaligtasan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}