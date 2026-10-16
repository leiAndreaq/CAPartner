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
        backgroundColor: '#033015',
        userSelect: 'none',
        fontFamily: "'Inter', sans-serif",
        transition: 'opacity 500ms ease-out',
        overflow: 'hidden',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      {/* Ambient Radial Background Glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(34,197,94,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px',
          textAlign: 'center',
          maxWidth: '90vw',
        }}
      >
        <div
          style={{
            position: 'relative',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img
            src={capLogo}
            alt="CAPartner Logo"
            draggable="false"
            style={{
              height: 'auto',
              width: '380px',
              maxWidth: '80vw',
              pointerEvents: 'none',
              userSelect: 'none',
              filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.5))',
            }}
          />
        </div>

        <h1
          style={{
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
            fontSize: '4.5rem',
            margin: '8px 0',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            userSelect: 'none',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
          }}
        >
          CAPartner
        </h1>

        <p
          style={{
            color: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            fontSize: '2rem',
            fontWeight: 500,
            margin: '-5px 0 0 0',
            opacity: 0.9,
            whiteSpace: 'nowrap',
            width: '100%',
            textAlign: 'center',
            userSelect: 'none',
                  }}
        >
          CAPartner sa Kalusugan, CAPartner sa Kaligtasan
        </p>
      </div>
    </div>
  );
}