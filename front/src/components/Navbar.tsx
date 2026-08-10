import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
	const [isMobile, setIsMobile] = useState<boolean>(false)

	useEffect(() => {
		const mediaQuery = window.matchMedia('(max-width: 720px)')

		const handler = () => {
			setIsMobile(mediaQuery.matches)
			if (!mediaQuery.matches) {
				setIsMenuOpen(false)
			}
		}

		handler()

		mediaQuery.addEventListener('change', handler)

		return () => {
			mediaQuery.removeEventListener('change', handler)
		}
	}, [])

	const toggleMenu = () => {
		setIsMenuOpen((current) => !current)
	}

	return (
		<header className="navbar-flat">
			<div style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: '16px'
			}}>
				<Link
					to="/"
					style={{
						fontSize: '1.1rem',
						fontWeight: 900,
						letterSpacing: '0.15em',
						textTransform: 'uppercase',
						color: 'var(--color-accent)'
					}}
				>
					42trc
				</Link>

				{!isMobile ? (
					<nav style={{ display: 'flex', gap: '8px' }}>
						<Link to="/" className="nav-link">Home</Link>
						<Link to="/store" className="nav-link">Store</Link>
						<Link to="/gambling" className="nav-link">Gambling</Link>
						<Link to="/user" className="nav-link">User</Link>
						<Link to="/login" className="nav-link">Login</Link>
						<Link to="/game" className="nav-link">Game</Link>
					</nav>
				) : (
					<button
						type="button"
						onClick={toggleMenu}
						aria-expanded={isMenuOpen}
						aria-controls="main-navigation"
						aria-label="Toggle navigation menu"
						className="btn-flat"
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: '40px',
							height: '40px',
							padding: 0,
							fontSize: '1.1rem',
						}}
					>
						<span aria-hidden="true">☰</span>
					</button>
				)}
			</div>

			{isMobile && isMenuOpen ? (
				<nav id="main-navigation" style={{
					marginTop: '16px',
					display: 'flex',
					flexDirection: 'column',
					gap: '8px'
				}}>
					<Link to="/" onClick={() => setIsMenuOpen(false)} className="nav-link">Home</Link>
					<Link to="/store" onClick={() => setIsMenuOpen(false)} className="nav-link">Store</Link>
					<Link to="/gambling" onClick={() => setIsMenuOpen(false)} className="nav-link">Gambling</Link>
					<Link to="/user" onClick={() => setIsMenuOpen(false)} className="nav-link">User</Link>
					<Link to="/login" onClick={() => setIsMenuOpen(false)} className="nav-link">Login</Link>
					<Link to="/game" onClick={() => setIsMenuOpen(false)} className="nav-link">Game</Link>
				</nav>
			) : null}
		</header>
	)
}

export default Navbar
