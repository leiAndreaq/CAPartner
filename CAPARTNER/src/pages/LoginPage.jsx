import { useState } from 'react';
import { Icon } from '@iconify/react';
import capLogo from '../assets/CAP LOGO.png';
import accountMale from '../assets/Account male.png';

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
        backgroundColor: '#064018',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* MAIN CARD CONTAINER */}
      <div
        className="login-card flex flex-col md:flex-row w-full max-w-[920px] min-h-[540px] rounded-[28px] p-3 box-border"
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          maxWidth: '920px',
          minHeight: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          padding: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
          boxSizing: 'border-box',
        }}
      >
        
        {/* LEFT PANEL: FORM SECTION */}
        <div
          className="login-form-panel flex-1 p-8 md:px-10 md:py-8 flex flex-col justify-between"
          style={{
            flex: 1,
            padding: '32px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            borderRadius: '20px 0 0 20px',
          }}
        >
          <div>
            {/* AVATAR HEADER */}
            <div className="text-center mb-2" style={{ textAlign: 'center', marginBottom: '8px' }}>
              <img
                src={accountMale}
                alt="Account Male"
                className="w-[82px] h-[82px] object-contain block mx-auto select-none pointer-events-none"
                style={{
                  width: '82px',
                  height: '82px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            </div>

            <h2
              className="text-3xl md:text-4xl font-extrabold text-center mb-1 tracking-tight"
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#064018',
                textAlign: 'center',
                margin: '0 0 4px 0',
                letterSpacing: '-0.02em',
              }}
            >
              LOGIN
            </h2>
            <p
              className="text-xs md:text-sm text-slate-800 text-center mb-6"
              style={{
                fontSize: '0.8rem',
                color: '#1e293b',
                textAlign: 'center',
                margin: '0 0 24px 0',
              }}
            >
              Sign in to access the CAPartner Admin Dashboard.
            </p>

            <form onSubmit={handleSubmit}>
              
              {/* ADMIN USERNAME INPUT */}
              <div className="mb-4" style={{ marginBottom: '16px' }}>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#064018',
                    marginBottom: '6px',
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
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '2px solid #064018',
                    backgroundColor: '#ffffff',
                    boxShadow: 'inset 0 3px 6px rgba(0, 0, 0, 0.12)',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* PASSWORD INPUT */}
              <div className="mb-4" style={{ marginBottom: '16px' }}>
                <label
                  className="block text-xs font-bold mb-1.5"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#064018',
                    marginBottom: '6px',
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
                      padding: '12px 44px 12px 16px',
                      borderRadius: '10px',
                      border: '2px solid #064018',
                      backgroundColor: '#ffffff',
                      boxShadow: 'inset 0 3px 6px rgba(0, 0, 0, 0.12)',
                      fontSize: '0.95rem',
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
                      color: '#064018',
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

              {/* REMEMBER ME & FORGOT PASSWORD */}
              <div
                className="flex justify-between items-center mb-5 text-xs font-semibold"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                <label
                  className="flex items-center gap-1.5 text-slate-800 cursor-pointer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#064018',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="cursor-pointer"
                    style={{ accentColor: '#064018' }}
                  />
                  Remember me
                </label>
                <a
                  href="#forgot"
                  className="no-underline font-bold hover:underline"
                  style={{
                    color: '#064018',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  Forgot Password?
                </a>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full py-3 text-white border-none rounded-lg font-extrabold text-sm cursor-pointer tracking-wider transition-colors"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#064018',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                LOGIN
              </button>

            </form>
          </div>

          {/* SECURITY BADGES FOOTER */}
          <div
            className="flex justify-between items-center pt-5 text-[11px] font-bold text-slate-800"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '20px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#1e293b',
            }}
          >
            <div className="flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon
                icon="bi:shield-lock-fill"
                className="w-5.5 h-5.5"
                style={{
                  width: '22px',
                  height: '22px',
                  color: '#064018',
                }}
              />
              Secure connection
            </div>
            <div className="flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon
                icon="bxs:check-shield"
                className="w-6 h-6"
                style={{
                  width: '24px',
                  height: '24px',
                  color: '#064018',
                }}
              />
              2-step verification required
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: BRAND BANNER */}
        <div
          className="login-brand-panel flex-1 p-6 flex flex-col items-center justify-center text-center rounded-b-[20px] md:rounded-bl-none md:rounded-r-[20px] box-border"
          style={{
            flex: 1,
            backgroundColor: '#033015',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderRadius: '0 20px 20px 0',
            boxSizing: 'border-box',
          }}
        >
          
          <div className="mb-4" style={{ marginBottom: '16px' }}>
            <div
              className="px-5 py-2 rounded-full text-emerald-500 text-[11px] font-extrabold tracking-wider inline-flex items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                padding: '8px 20px',
                borderRadius: '20px',
                color: '#22c55e',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
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
                margin: '0 0 4px 0',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              CAPartner
            </h1>
            <p
              className="text-white text-sm font-normal opacity-90"
              style={{
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 400,
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