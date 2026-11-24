import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { gameSocket } from '../../services/gameSocket'
import type { GameMessage } from './utils/gameCodec'
import { ticTacToeColors } from './utils/picnicTable'
import './TicTacToeOverlay.css'

type Mark = 'X' | 'O'

const emptyBoard = Array<Mark | ''>(9).fill('')
const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

const boardPalette = {
  '--board-frame': ticTacToeColors.frame,
  '--tile-light': ticTacToeColors.lightTile,
  '--tile-sand': ticTacToeColors.sandTile,
  '--mark-x': ticTacToeColors.X,
  '--mark-o': ticTacToeColors.O,
} as CSSProperties

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
  const board = match?.board ?? emptyBoard
  const winner = match?.result
  const winningLine = winner === 'X' || winner === 'O'
    ? winningLines.find((line) => line.every((cell) => board[cell] === winner))
    : undefined
  const firstCell = winningLine?.[0]
  const lastCell = winningLine?.[2]

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
          setSearching(false)
          setError(String(payload))
          break
      }
    }

    gameSocket.on('player:action', handleAction)
    return () => gameSocket.off('player:action', handleAction)
  }, [])

  useEffect(() => {
    if (!winner) return
    const timer = window.setTimeout(onClose, 5000)
    return () => window.clearTimeout(timer)
  }, [winner, onClose])

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
      style={boardPalette}
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

      <div className="tic-tac-toe-board" aria-label="Game board" role="group">
        {board.map((cell, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Cell ${index + 1}, ${cell || 'empty'}`}
            data-mark={cell}
            disabled={!canMove || Boolean(cell)}
            onClick={() => {
              if (!match || !canMove || cell) return
              gameSocket.sendAction('tictactoe:move', {
                matchId: match.id,
                cell: index,
                version: match.version,
              })
            }}
          >
            {cell}
          </button>
        ))}
        {firstCell !== undefined && lastCell !== undefined && (
          <svg className="tic-tac-toe-win" viewBox="0 0 300 300" aria-hidden="true" data-mark={winner}>
            <line
              x1={(firstCell % 3) * 100 + 50}
              y1={Math.floor(firstCell / 3) * 100 + 50}
              x2={(lastCell % 3) * 100 + 50}
              y2={Math.floor(lastCell / 3) * 100 + 50}
              pathLength="1"
            />
          </svg>
        )}
      </div>

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
