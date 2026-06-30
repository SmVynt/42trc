const HomePage = (): JSX.Element => {
  return (
    <main style={{
      display: 'grid',
      placeItems: 'center',
      flex: 1,
      padding: '32px 0'
    }}>
      <section style={{
        width: 'min(640px, 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        background: 'rgba(15, 23, 42, 0.8)',
        padding: '32px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.28)'
      }}>
        <p style={{
          margin: '0 0 12px',
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: '#7dd3fc'
        }}>
          HomePage
        </p>

        <h1 style={{
          margin: 0,
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          lineHeight: 1.05,
          color: '#ffffff'
        }}>
          The app is rendering.
        </h1>

        <p style={{
          margin: '16px 0 0',
          color: '#cbd5e1',
          fontSize: '1.05rem'
        }}>
          This is a basic home screen so you can confirm the router and layout are working.
        </p>
      </section>
    </main>
  )
}

export default HomePage
