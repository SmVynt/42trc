import { useEffect, useRef, useState } from 'react'
import { gameSocket } from '../../services/gameSocket'
import type { GameMessage } from './utils/gameCodec'
import './TicTacToeOverlay.css'

type Mark = 'X' | 'O'

type Match = {
  id: string
  xPlayerId: string
  oPlayerId: string
  board: (Mark | '')[]
  turn: Mark | ''
  version: number
  result?: Mark | 'draw'
}

export default function TicTacToeOverlay({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [searching, setSearching] = useState(false)
  const [match, setMatch] = useState<Match | null>(null)
  const [error, setError] = useState('')
  const mark = match?.xPlayerId === gameSocket.playerId ? 'X' : 'O'
  const canMove = Boolean(match && !match.result && match.turn === mark)

  useEffect(() => {
    dialog.current?.showModal()

    const handleAction = ({ action, payload }: GameMessage) => {
      switch (action) {
        case 'tictactoe:waiting':
          setSearching(true)
          break
        case 'tictactoe:idle':
          setSearching(false)
          break
        case 'tictactoe:matched':
        case 'tictactoe:state':
          setMatch(payload as Match)
          setSearching(false)
          setError('')
          break
        case 'tictactoe:error':
          setError(String(payload))
          break
      }
    }

    gameSocket.on('player:action', handleAction)
    return () => gameSocket.off('player:action', handleAction)
  }, [])

  const close = () => {
    if (searching) gameSocket.sendAction('tictactoe:leaveQueue')
    onClose()
  }

  let status = searching ? 'Looking for an opponent…' : 'Find an opponent to start a match.'
  if (match?.result) {
    status = match.result === 'draw' ? 'Draw' : match.result === mark ? 'You won!' : 'Your opponent won'
  } else if (match) {
    status = canMove ? 'Your turn' : 'Opponent’s turn'
  }

  return (
    <dialog
      ref={dialog}
      className="tic-tac-toe"
      aria-labelledby="tic-tac-toe-title"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
    >
      <header>
        <h2 id="tic-tac-toe-title">Tic-Tac-Toe</h2>
        {match && <span>You play as {mark}</span>}
      </header>
      <p role="status">{status}</p>

      {match && (
        <div className="tic-tac-toe-board" aria-label="Game board" role="group">
          {match.board.map((cell, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Cell ${index + 1}, ${cell || 'empty'}`}
              data-mark={cell}
              disabled={!canMove || Boolean(cell)}
              onClick={() => gameSocket.sendAction('tictactoe:move', {
                matchId: match.id,
                cell: index,
                version: match.version,
              })}
            >
              {cell}
            </button>
          ))}
        </div>
      )}

      {error && <p role="alert">{error}</p>}
      <footer>
        {!match && !searching && (
          <button type="button" onClick={() => {
            setError('')
            setSearching(true)
            gameSocket.sendAction('tictactoe:joinQueue')
          }}>
            Find opponent
          </button>
        )}
        {!match && searching && (
          <button type="button" onClick={() => gameSocket.sendAction('tictactoe:leaveQueue')}>
            Cancel search
          </button>
        )}
        <button type="button" onClick={close}>Return to hub</button>
      </footer>
    </dialog>
  )
}
