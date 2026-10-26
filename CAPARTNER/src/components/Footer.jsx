export default function Footer() {
  return (
    <footer
      className="w-full text-center py-4 text-xs font-medium text-white box-border"
      style={{
        width: '100%',
        background: 'linear-gradient(135deg, rgba(2, 29, 18, 0.96), rgba(9, 48, 30, 0.96))',
        color: '#ecfdf5',
        textAlign: 'center',
        padding: '26px 24px',
        fontSize: '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        boxSizing: 'border-box',
        marginTop: 'auto',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p className="m-0" style={{ margin: 0, opacity: 0.9 }}>
        © 2026 CAPartner • All rights reserved.
      </p>
    </footer>
  );
}