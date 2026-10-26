import { useState, useRef } from 'react';
import { Icon } from '@iconify/react';

export default function TwoFactorPage({ onVerifySuccess, userEmail = "*******@gmail.com" }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // FRONTEND-ONLY VALIDATION & VERIFY SUBMISSION
  const handleVerify = (e) => {
    e.preventDefault();
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

    // Simulate instant client-side transition
    setTimeout(() => {
      setIsSubmitting(false);
      if (onVerifySuccess) {
        onVerifySuccess();
      }
    }, 600);
  };

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center p-6 box-border font-sans"
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(180deg, rgba(3, 17, 11, 0.5), rgba(3, 17, 11, 0.62))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '510px',
          background: 'rgba(8, 40, 26, 0.76)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '28px',
          padding: '36px 28px 28px',
          boxShadow: '0 26px 60px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            width: '112px',
            height: '112px',
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #0c4d2d 0%, #0b3b25 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '22px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 26px rgba(3, 17, 11, 0.28)',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon="lucide:smartphone" width="52" height="52" color="#ffffff" />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#0b3b25',
                borderRadius: '8px',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon icon="mdi:email-outline" width="22" height="22" color="#ffffff" />
            </div>
          </div>
        </div>

        <h2
          style={{
            fontSize: 'clamp(2rem, 3vw, 2.5rem)',
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            margin: '0 0 12px 0',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
          }}
        >
          Two-factor verification
        </h2>

        <p
          style={{
            fontSize: '0.9rem',
            color: '#e5f7ef',
            textAlign: 'center',
            margin: '0 0 26px 0',
            lineHeight: '1.6',
            maxWidth: '390px',
            fontWeight: 500,
          }}
        >
          Enter the 6-digit code sent to your registered email address ({userEmail}). The code expires in 5 minutes.
        </p>

        {error && (
          <div
            style={{
              width: '100%',
              backgroundColor: 'rgba(254, 202, 202, 0.18)',
              border: '1px solid rgba(248, 113, 113, 0.5)',
              color: '#fee2e2',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '20px',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Icon icon="mdi:alert-circle" width="16" height="16" color="#fecaca" />
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              marginBottom: '28px',
              width: '100%',
            }}
          >
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                style={{
                  width: '48px',
                  height: '58px',
                  borderRadius: '14px',
                  border: error ? '2px solid rgba(248, 113, 113, 0.9)' : '2px solid rgba(255,255,255,0.38)',
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  color: '#08341d',
                  fontSize: '1.7rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: 'inset 0 1px 3px rgba(15,23,42,0.08)',
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '16px 18px',
              background: 'linear-gradient(180deg, #0d5b35 0%, #0a492c 100%)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '1.05rem',
              cursor: isSubmitting ? 'wait' : 'pointer',
              letterSpacing: '0.02em',
              boxShadow: '0 14px 28px rgba(5, 35, 22, 0.24)',
            }}
          >
            {isSubmitting ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <p
          style={{
            fontSize: '0.8rem',
            color: '#e5f7ef',
            textAlign: 'center',
            marginTop: '22px',
            marginBottom: 0,
            fontWeight: 500,
          }}
        >
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={() => {
              setCode(['', '', '', '', '', '']);
              setError('');
              inputRefs.current[0]?.focus();
            }}
            style={{
              color: '#ffffff',
              fontWeight: 800,
              textDecoration: 'underline',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
}