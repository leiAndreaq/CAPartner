import { useEffect, useState } from 'react';

const capLogo = new URL('../assets/CAP LOGO.png', import.meta.url).href;

export default function SplashScreen({ onFinish, duration = 1800 }) {
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#063b22',
        transition: 'opacity 500ms ease-out',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <img
          src={capLogo}
          alt="CAPartner Logo"
          draggable="false"
          style={{
            width: 'min(65vw, 280px)',
            height: 'auto',
            userSelect: 'none',
            marginBottom: '20px',
          }}
        />

        <h1
          style={{
            margin: 0,
            color: '#ffffff',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            lineHeight: 1,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          CAPartner
        </h1>

        <p
          style={{
            margin: '12px 0 0 0',
            color: '#ffffff',
            fontSize: 'clamp(0.8rem, 1.6vw, 1.1rem)',
            fontWeight: 400,
            letterSpacing: '0.02em',
            opacity: 0.9,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          CAPartner sa Kalusugan, CAPartner sa Kaligtasan
        </p>
      </div>
    </div>
  );
}