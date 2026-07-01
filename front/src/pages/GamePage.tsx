import { Suspense, useMemo, useState } from 'react'
import Game from '../components/game/Game'
import { PlayersProvider } from '../context/players.context'

const GamePage = () : JSX.Element => {

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
