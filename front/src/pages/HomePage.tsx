import { Link } from 'react-router-dom'

const HomePage = () => {
  return (
    <main style={{
      display: 'grid',
      placeItems: 'center',
      flex: 1,
      padding: '32px 0'
    }}>
      <section className="card-flat" style={{
        width: 'min(640px, 100%)',
        padding: '40px',
      }}>
        <p style={{
          margin: '0 0 12px',
          fontSize: '0.85rem',
          fontWeight: 800,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)'
        }}>
          Welcome to Transcendence
        </p>

        <h1 style={{
          margin: 0,
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          lineHeight: 1.05,
          color: 'var(--color-text)',
          fontWeight: 900,
        }}>
          A cozy multiplayer social space.
        </h1>

        <p style={{
          margin: '20px 0 0',
          color: 'var(--color-text-muted)',
          fontSize: '1.1rem',
          lineHeight: 1.6
        }}>
          Connect with friends, customize your character with items purchased via 42 coalition points, and hang out on our sunny 3D low-poly beach!
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          marginTop: '32px'
        }}>
          <Link to="/game" className="btn-flat btn-flat--accent" style={{ textDecoration: 'none' }}>
            Play Game 🎮
          </Link>
          <Link to="/user" className="btn-flat" style={{ textDecoration: 'none' }}>
            My Account 👤
          </Link>
        </div>
      </section>
    </main>
  )
}

export default HomePage
