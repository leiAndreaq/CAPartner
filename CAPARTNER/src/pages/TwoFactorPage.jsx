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
        backgroundColor: '#064018',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* CENTERED WHITE CARD CONTAINER */}
      <div
        className="w-full max-w-[460px] bg-white rounded-[28px] p-8 md:p-10 shadow-2xl flex flex-col items-center box-border"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '28px',
          padding: '36px 32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* TOP CIRCULAR PHONE & MAIL ICON */}
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
          style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            backgroundColor: '#064018',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon="lucide:smartphone" width="54" height="54" color="#ffffff" />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#064018',
                borderRadius: '4px',
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

        {/* PAGE TITLE */}
        <h2
          className="text-2xl md:text-3xl font-extrabold text-[#064018] text-center mb-2 tracking-tight"
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#064018',
            textAlign: 'center',
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Two-factor verification
        </h2>

        {/* SUBTITLE */}
        <p
          className="text-xs md:text-sm text-slate-600 text-center italic mb-6 leading-relaxed"
          style={{
            fontSize: '0.8rem',
            color: '#475569',
            textAlign: 'center',
            fontStyle: 'italic',
            margin: '0 0 24px 0',
            lineHeight: '1.4',
            maxWidth: '360px',
          }}
        >
          Enter the 6-digit code sent to your registered email address ({userEmail}). The code expires in 5 minutes.
        </p>

        {/* ERROR VALIDATION MESSAGE */}
        {error && (
          <div
            className="w-full bg-red-50 border border-red-300 text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold text-center mb-5 flex items-center justify-center gap-1.5"
            style={{
              width: '100%',
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '0.78rem',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '20px',
              boxSizing: 'border-box',
            }}
          >
            <Icon icon="mdi:alert-circle" width="16" height="16" color="#dc2626" />
            {error}
          </div>
        )}

        {/* OTP INPUTS FORM */}
        <form onSubmit={handleVerify} className="w-full flex flex-col items-center" style={{ width: '100%' }}>
          <div
            className="flex gap-2 md:gap-2.5 justify-center mb-7 w-full"
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
                placeholder={digit ? '' : ''}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-11 h-14 md:w-12 md:h-14 rounded-xl text-center text-xl font-bold outline-none transition-colors"
                style={{
                  width: '46px',
                  height: '54px',
                  borderRadius: '12px',
                  border: error ? '2px solid #dc2626' : '2px solid #064018',
                  backgroundColor: '#ffffff',
                  color: '#064018',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            ))}
          </div>

          {/* VERIFY BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#064018] hover:bg-[#042d11] text-white border-none rounded-2xl font-extrabold text-sm cursor-pointer tracking-wider transition-colors"
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#064018',
              color: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: isSubmitting ? 'wait' : 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            {isSubmitting ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {/* RESEND OTP FOOTER LINK */}
        <p
          className="text-xs text-slate-700 text-center mt-6 italic"
          style={{
            fontSize: '0.78rem',
            color: '#334155',
            textAlign: 'center',
            marginTop: '24px',
            marginBottom: 0,
            fontStyle: 'italic',
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
            className="font-bold underline text-[#064018] cursor-pointer not-italic bg-transparent border-none p-0"
            style={{
              color: '#064018',
              fontWeight: 800,
              textDecoration: 'underline',
              fontStyle: 'normal',
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