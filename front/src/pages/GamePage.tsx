import { Suspense, useMemo, useState } from 'react'
import { Game } from '../components/game/Game'

const GamePage = () : JSX.Element => {

  return (
	<main>
		<section style={{ width: '100%', height: '100vh', display: 'grid', placeItems: 'center' }}>
			<Game />
	  </section>
	</main>
  )
}

export default GamePage
