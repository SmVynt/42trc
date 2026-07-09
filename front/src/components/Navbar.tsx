import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const linkStyle = {
	padding: '10px 14px',
	borderRadius: '12px',
	color: '#e2e8f0',
	transition: 'background-color 0.2s ease, color 0.2s ease',
}

const Navbar = (): JSX.Element => {
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
		<header style={{
			borderBottom: '1px solid rgba(255,255,255,0.08)',
			background: 'rgba(2, 6, 23, 0.72)',
			padding: '16px 24px',
			backdropFilter: 'blur(16px)'
		}}>
			<div style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: '16px'
			}}>
				<Link
					to="/"
					style={{
						fontSize: '0.85rem',
						fontWeight: 700,
						letterSpacing: '0.3em',
						textTransform: 'uppercase',
						color: '#7dd3fc'
					}}
				>
					42trc
				</Link>

				{!isMobile ? (
					<nav style={{ display: 'flex', gap: '8px' }}>
						<Link to="/" style={linkStyle}>Home</Link>
						<Link to="/store" style={linkStyle}>Store</Link>
						<Link to="/gambling" style={linkStyle}>Gambling</Link>
						<Link to="/user" style={linkStyle}>User</Link>
						<Link to="/login" style={linkStyle}>Login</Link>
						<Link to="/game" style={linkStyle}>Game</Link>
					</nav>
				) : (
					<button
						type="button"
						onClick={toggleMenu}
						aria-expanded={isMenuOpen}
						aria-controls="main-navigation"
						aria-label="Toggle navigation menu"
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: '44px',
							height: '44px',
							borderRadius: '12px',
							border: '1px solid rgba(255,255,255,0.12)',
							background: 'rgba(15, 23, 42, 0.92)',
							color: '#f8fafc',
							fontSize: '1.1rem',
							cursor: 'pointer',
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
					<Link to="/" onClick={() => setIsMenuOpen(false)} style={linkStyle}>Home</Link>
					<Link to="/store" onClick={() => setIsMenuOpen(false)} style={linkStyle}>Store</Link>
					<Link to="/gambling" onClick={() => setIsMenuOpen(false)} style={linkStyle}>Gambling</Link>
					<Link to="/user" onClick={() => setIsMenuOpen(false)} style={linkStyle}>User</Link>
					<Link to="/login" onClick={() => setIsMenuOpen(false)} style={linkStyle}>Login</Link>
					<Link to="/game" onClick={() => setIsMenuOpen(false)} style={linkStyle}>Game</Link>
				</nav>
			) : null}
		</header>
	)
}

export default Navbar
