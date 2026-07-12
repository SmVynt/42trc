import { Navigate } from 'react-router-dom'
import Game from '../components/game/Game'
import { PlayersProvider } from '../context/players.context'
import { useAuth } from '../hooks/useAuth'

const GamePage = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <main style={{ padding: 24, color: '#f8fafc' }}>Loading game session...</main>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
	<PlayersProvider>
		<main>
			<section style={{ width: '100%', height: '100vh', display: 'grid', placeItems: 'center' }}>
				<Game />
		  </section>
		</main>
	</PlayersProvider>
  )
}

export default GamePage
