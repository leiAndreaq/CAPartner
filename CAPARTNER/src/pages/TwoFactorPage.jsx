import { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { adminVerifyCode } from '../api';
import './AuthPages.css';

const mobileEmail = new URL('../assets/auth/mobile-email.png', import.meta.url).href;

// SHOW ONLY THE START OF THE EMAIL: capartnerwithus@gmail.com -> ca*************@gmail.com
function maskEmail(email) {
  const [name, domain] = String(email).split('@');
  if (!domain) return '*******@gmail.com';
  return name.slice(0, 2) + '*'.repeat(Math.max(name.length - 2, 3)) + '@' + domain;
}

export default function TwoFactorPage({
  onVerifySuccess,
  onBackToLogin,
  pendingToken,
  userEmail = '',
  codeValidMinutes = 15,
}) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mustStartAgain, setMustStartAgain] = useState(false);
  const inputRefs = useRef([]);

  // HANDLE SINGLE-DIGIT TYPING AND AUTO-FOCUS
  const handleChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (error) setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // HANDLE BACKSPACE KEY NAVIGATION
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // HANDLE PASTE EVENT FOR 6-DIGIT CODE
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split('');
      while (newCode.length < 6) newCode.push('');
      setCode(newCode);
      if (error) setError('');
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // VALIDATION, THEN STEP 2 OF LOGIN: THE BACKEND CHECKS THE CODE
  const handleVerify = async (e) => {
    e.preventDefault();
    if (mustStartAgain) {
      if (onBackToLogin) onBackToLogin();
      return;
    }
    const fullCode = code.join('');

    // 1. Validation check for completely empty input
    if (fullCode.length === 0) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    // 2. Validation check for incomplete input (< 6 digits)
    if (fullCode.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const result = await adminVerifyCode(pendingToken, fullCode);
      if (onVerifySuccess) {
        onVerifySuccess(result);
      }
    } catch (err) {
      setIsSubmitting(false);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      if (err.data && typeof err.data.triesLeft === 'number') {
        setError(`${err.message} ${err.data.triesLeft} ${err.data.triesLeft === 1 ? 'try' : 'tries'} left.`);
      } else {
        // Code expired, used up, or the server is down: a new login is needed
        setError(err.message);
        if (err.status !== 0) setMustStartAgain(true);
      }
    }
  };

  return (
    <div className="login-shell">
      {/* CENTERED WHITE CARD CONTAINER */}
      <div className="tf-card">
        {/* TOP CIRCULAR PHONE & MAIL ICON */}
        <div className="tf-icon">
          <img src={mobileEmail} alt="" />
        </div>

        <h2 className="tf-title">Two-factor verification</h2>

        <p className="tf-lead">
          Enter the 6-digit code sent to your registered email address ({maskEmail(userEmail)}). The code expires in {codeValidMinutes} minutes. Check your spam folder too.
        </p>

        {/* ERROR VALIDATION MESSAGE */}
        {error && (
          <div role="alert" className="auth-error" style={{ width: '100%' }}>
            <Icon icon="mdi:alert-circle" width="16" height="16" />
            {error}
          </div>
        )}

        {/* OTP INPUTS FORM */}
        <form onSubmit={handleVerify} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className={`tf-codes${error ? ' has-error' : ''}`}>
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                aria-label={`Digit ${idx + 1}`}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
              />
            ))}
          </div>

          {/* VERIFY BUTTON */}
          <button type="submit" disabled={isSubmitting} className="tf-submit">
            {mustStartAgain ? 'Back to login' : isSubmitting ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {/* RESEND OTP FOOTER LINK */}
        <p className="tf-resend">
          Didn't receive the code?{' '}
          <button
            type="button"
            title="A new code needs your password again"
            onClick={() => {
              // A new code is sent by logging in again (the backend needs the password for that)
              if (onBackToLogin) onBackToLogin();
            }}
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
}
