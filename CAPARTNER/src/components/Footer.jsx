export default function Footer() {
  return (
    <footer
      className="w-full text-center py-4 text-xs font-medium text-white box-border"
      style={{
        width: '100%',
        backgroundColor: '#043114',
        color: '#ffffff',
        textAlign: 'center',
        padding: '28px 24px',
        fontSize: '0.8rem',
        fontWeight: 500,
        letterSpacing: '0.02em',
        boxSizing: 'border-box',
        marginTop: 'auto',
      }}
    >
      <p className="m-0" style={{ margin: 0 }}>
        © 2026 CAPartner • All rights reserved.
      </p>
    </footer>
  );
}