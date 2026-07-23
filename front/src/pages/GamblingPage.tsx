import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { gamblingService } from '../services/gambling/gambling.service'
import type { CoinFlipGuess, CoinFlipResponse } from '../types/gambling'

const gamblerCardStyle: React.CSSProperties = {
	borderRadius: 28,
	border: '1px solid rgba(148, 163, 184, 0.18)',
	background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.84))',
	boxShadow: '0 24px 80px rgba(2, 6, 23, 0.35)',
	padding: 24,
	display: 'grid',
	gap: 20,
	color: '#e2e8f0',
}

const GamblingPage = () => {
	const { user, loading } = useAuth()
	const [wallet, setWallet] = useState(0)
	const [betAmount, setBetAmount] = useState(10)
	const [guess, setGuess] = useState<CoinFlipGuess>('heads')
	const [result, setResult] = useState<CoinFlipResponse | null>(null)
	const [message, setMessage] = useState('Pick a side and try your luck.')
	const [isPlaying, setIsPlaying] = useState(false)

	useEffect(() => {
		setWallet(user?.wallet ?? 0)
	}, [user])

	const balanceLabel = useMemo(() => `${wallet} coins`, [wallet])

	if (loading) {
		return <main style={{ padding: 24 }}>Loading...</main>
	}

	if (!user) {
		return <Navigate to="/login" replace />
	}

	const handlePlay = async () => {
		setIsPlaying(true)
		setMessage('Spinning the coin...')

		try {
			const response = await gamblingService.playCoinFlip({
				betAmount,
				guess,
			})

			setResult(response)
			setWallet(response.wallet)
			setMessage(response.result === guess ? `You won ${response.winAmount} coins.` : `You lost ${response.betAmount} coins.`)
		} catch (error) {
			const text = error instanceof Error ? error.message : 'Coin flip failed.'
			setMessage(text)
		} finally {
			setIsPlaying(false)
		}
	}

	return (
		<main style={{ padding: '24px 0 32px', display: 'grid', gap: 20 }}>
			<section
				style={{
					display: 'grid',
					gap: 12,
					padding: '8px 0 4px',
				}}
			>
				<h1 style={{ margin: 0, fontSize: 'clamp(2.3rem, 5vw, 4.2rem)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
					Gambling
				</h1>
				<p style={{ margin: 0, maxWidth: 700, color: '#94a3b8', fontSize: '1.02rem', lineHeight: 1.6 }}>
					Check your current balance and flip a coin against the server.
				</p>
			</section>

			<section style={gamblerCardStyle}>
				<div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
					<div>
						<div style={{ fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#94a3b8' }}>Current wallet</div>
						<div style={{ marginTop: 8, fontSize: 'clamp(2rem, 6vw, 3.8rem)', fontWeight: 800, color: '#f8fafc' }}>{balanceLabel}</div>
					</div>
					<div style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#7dd3fc', fontWeight: 700 }}>
						Logged in as {user.email}
					</div>
				</div>

				<div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
					<label style={{ display: 'grid', gap: 8 }}>
						<span style={{ color: '#cbd5e1', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Bet amount</span>
						<input
							type="number"
							min={1}
							value={betAmount}
							onChange={(event) => setBetAmount(Number(event.target.value))}
							style={{
								borderRadius: 16,
								border: '1px solid rgba(148, 163, 184, 0.18)',
								background: 'rgba(15, 23, 42, 0.72)',
								color: '#f8fafc',
								padding: '14px 16px',
								fontSize: 16,
							}}
						/>
					</label>

					<div style={{ display: 'grid', gap: 8 }}>
						<span style={{ color: '#cbd5e1', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your guess</span>
						<div style={{ display: 'flex', gap: 10 }}>
							{(['heads', 'tails'] as CoinFlipGuess[]).map((choice) => {
								const active = guess === choice
								return (
									<button
										key={choice}
										type="button"
										onClick={() => setGuess(choice)}
										style={{
											flex: 1,
											borderRadius: 16,
											border: active ? '1px solid rgba(125, 211, 252, 0.85)' : '1px solid rgba(148, 163, 184, 0.16)',
											background: active ? 'linear-gradient(180deg, rgba(14, 165, 233, 0.28), rgba(15, 23, 42, 0.72))' : 'rgba(15, 23, 42, 0.72)',
											color: '#f8fafc',
											padding: '14px 16px',
											fontSize: 15,
											fontWeight: 700,
											cursor: 'pointer',
										}}
									>
										{choice}
									</button>
								)
							})}
						</div>
					</div>
				</div>

				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
					<div style={{ color: '#cbd5e1' }}>{message}</div>
					<button
						type="button"
						onClick={handlePlay}
						disabled={isPlaying}
						style={{
							borderRadius: 16,
							border: 'none',
							padding: '14px 20px',
							background: isPlaying ? 'rgba(148, 163, 184, 0.28)' : 'linear-gradient(135deg, #f59e0b, #ef4444)',
							color: '#fff7ed',
							fontWeight: 800,
							fontSize: 15,
							cursor: isPlaying ? 'wait' : 'pointer',
							minWidth: 160,
						}}
					>
						{isPlaying ? 'Flipping...' : 'Play coinflip'}
					</button>
				</div>

				{result ? (
					<div style={{ display: 'grid', gap: 10, padding: 16, borderRadius: 20, background: 'rgba(2, 6, 23, 0.44)', border: '1px solid rgba(148, 163, 184, 0.14)' }}>
						<div style={{ fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#94a3b8' }}>Last round</div>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: '#f8fafc', fontWeight: 700 }}>
							<span>Result: {result.result}</span>
							<span>Bet: {result.betAmount}</span>
							<span>Win: {result.winAmount}</span>
						</div>
					</div>
				) : null}
			</section>
		</main>
	)
}

export default GamblingPage
