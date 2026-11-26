import { useEffect, useState } from 'react';

const capLogo = new URL('../assets/CAP LOGO.png', import.meta.url).href;

// SPLASH SCREEN, like the Figma design: big logo, name and tagline on dark green.
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
        backgroundColor: 'var(--green-700)',
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px',
          textAlign: 'center',
          maxWidth: '95vw',
        }}
      >
        <img
          src={capLogo}
          alt="CAPartner Logo"
          draggable="false"
          style={{
            height: 'auto',
            width: '433px',
            maxWidth: '70vw',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />

        <h1
          style={{
            color: '#ffffff',
            fontWeight: 900,
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            margin: '0',
            lineHeight: 1.1,
            letterSpacing: '-0.725px',
          }}
        >
          CAPartner
        </h1>

        <p
          style={{
            color: '#ffffff',
            fontSize: 'clamp(1rem, 2.6vw, 2rem)',
            fontWeight: 400,
            margin: '8px 0 0',
            letterSpacing: '2px',
            textAlign: 'center',
          }}
        >
          CAPartner sa Kalusugan, CAPartner sa Kaligtasan
        </p>
      </div>
    </div>
  );
}
