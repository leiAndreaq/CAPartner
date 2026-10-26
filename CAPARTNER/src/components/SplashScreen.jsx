import { useEffect, useState } from 'react';

const capLogo = new URL('../assets/CAP LOGO.png', import.meta.url).href;

export default function SplashScreen({ onFinish, duration = 1500 }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 400);

    const finishTimer = setTimeout(() => {
      document.body.style.overflow = 'unset';
      if (onFinish) onFinish();
    }, duration);

    return () => {
      document.body.style.overflow = 'unset';
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      onClick={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.22) 0%, rgba(4, 38, 24, 0.95) 32%, rgba(2, 15, 10, 1) 100%)',
        userSelect: 'none',
        fontFamily: "'Inter', sans-serif",
        transition: 'opacity 500ms ease-out',
        overflow: 'hidden',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 30%, rgba(34,197,94,0.18), transparent 25%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.12), transparent 35%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '28px 24px',
          textAlign: 'center',
          maxWidth: '92vw',
        }}
      >
        <div
          style={{
            position: 'relative',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '18px 20px 12px',
            borderRadius: '22px',
            border: '1px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.03)',
            boxShadow: '0 28px 60px rgba(0,0,0,0.18)',
          }}
        >
          <img
            src={capLogo}
            alt="CAPartner Logo"
            draggable="false"
            style={{
              height: 'auto',
              width: '360px',
              maxWidth: '78vw',
              pointerEvents: 'none',
              userSelect: 'none',
              filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.35))',
            }}
          />
        </div>

        <h1
          style={{
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2.75rem, 6vw, 5rem)',
            margin: '10px 0 10px',
            lineHeight: 0.96,
            letterSpacing: '-0.05em',
            userSelect: 'none',
            filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.25))',
          }}
        >
          CAPartner
        </h1>

        <p
          style={{
            color: '#ecfdf5',
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(0.9rem, 1.8vw, 1.75rem)',
            fontWeight: 500,
            margin: 0,
            opacity: 0.9,
            width: '100%',
            textAlign: 'center',
            lineHeight: 1.35,
            userSelect: 'none',
          }}
        >
          CAPartner sa Kalusugan, CAPartner sa Kaligtasan
        </p>
      </div>
    </div>
  );
}