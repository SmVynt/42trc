export type CoinFlipGuess = 'heads' | 'tails'

export type CoinFlipResponse = {
  message: string
  result: CoinFlipGuess
  winAmount: number
  betAmount: number
  wallet: number
}