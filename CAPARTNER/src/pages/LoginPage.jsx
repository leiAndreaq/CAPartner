import { useState } from 'react';
import { Icon } from '@iconify/react';
import { adminLogin, getRememberedEmail, setRememberedEmail } from '../api';
import './AuthPages.css';

const capLogo = new URL('../assets/CAP LOGO.png', import.meta.url).href;
const accountMale = new URL('../assets/Account Male.png', import.meta.url).href;
const eyeIcon = new URL('../assets/auth/eye.png', import.meta.url).href;
const lockIcon = new URL('../assets/auth/security-lock.png', import.meta.url).href;
const protectIcon = new URL('../assets/auth/protect.png', import.meta.url).href;

export default function LoginPage({ onLoginSuccess, notice = '' }) {
  const [email, setEmail] = useState(getRememberedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 1 OF LOGIN: CHECK EMAIL + PASSWORD WITH THE BACKEND, WHICH EMAILS A 6-DIGIT CODE
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const result = await adminLogin(cleanEmail, password);
      setRememberedEmail(rememberMe ? cleanEmail : '');
      setPassword('');
      if (onLoginSuccess) {
        onLoginSuccess({
          pendingToken: result.pendingToken,
          email: cleanEmail,
          codeValidMinutes: result.codeValidMinutes,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      {/* MAIN CARD CONTAINER */}
      <div className="login-card">
        {/* LEFT PANEL: FORM SECTION */}
        <div className="login-form-panel">
          <div>
            <img src={accountMale} alt="" className="login-avatar" />
            <h2 className="login-title">LOGIN</h2>
            <p className="login-lead">Sign in to access the CAPartner Admin Dashboard.</p>

            <form onSubmit={handleSubmit} noValidate>
              {/* INFO MESSAGE (EXAMPLE: SIGNED OUT AUTOMATICALLY) */}
              {notice && !error && <div className="auth-notice">{notice}</div>}

              {/* ERROR MESSAGE FROM THE BACKEND (WRONG PASSWORD, LOCKED, SERVER DOWN) */}
              {error && (
                <div role="alert" className="auth-error">
                  <Icon icon="mdi:alert-circle" width="16" height="16" />
                  {error}
                </div>
              )}

              {/* ADMIN EMAIL INPUT */}
              <div className="auth-field">
                <label htmlFor="admin-email">Admin Email</label>
                <div className="auth-input">
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* PASSWORD INPUT */}
              <div className="auth-field">
                <label htmlFor="admin-password">Password</label>
                <div className="auth-input">
                  <input
                    id="admin-password"
                    className="has-eye"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className={`auth-eye${showPassword ? ' is-shown' : ''}`}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <img src={eyeIcon} alt="" />
                  </button>
                </div>
              </div>

              {/* REMEMBER ME & FORGOT PASSWORD */}
              <div className="login-options">
                <label>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  Remember me
                </label>
                <a href="#forgot">Forgot Password?</a>
              </div>

              {/* SUBMIT BUTTON */}
              <button type="submit" disabled={isSubmitting} className="auth-submit">
                {isSubmitting ? 'SENDING CODE...' : 'LOGIN'}
              </button>
            </form>
          </div>

          {/* SECURITY BADGES FOOTER */}
          <div className="login-badges">
            <span><img src={lockIcon} alt="" /> Secure connection</span>
            <span><img src={protectIcon} alt="" /> 2-step verification required</span>
          </div>
        </div>

        {/* RIGHT PANEL: BRAND BANNER */}
        <div className="login-brand-panel">
          <div className="login-pill">SMART CAP MONITORING CONSOLE</div>
          <img src={capLogo} alt="CAPartner Logo" />
          <h1>CAPartner</h1>
          <p>CAPartner sa kalusugan, CAPartner sa kaligtasan</p>
        </div>
      </div>
    </div>
  );
}
