const FooterFixed = () => {
  return (
    <footer style={{
      borderTop: 'var(--border-width) solid var(--border-color)',
      background: '#FFFFFF',
      padding: '16px 24px',
      fontSize: '0.9rem',
      color: 'var(--color-text-muted)',
      textAlign: 'center',
      marginTop: 'auto'
    }}>
      <p style={{ margin: 0, fontWeight: 700, letterSpacing: '0.08em' }}>
        Transcendence © 2026 · Built with 42 API
      </p>
    </footer>
  )
}

export default FooterFixed
