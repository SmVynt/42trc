export type CoinFlipGuess = 'heads' | 'tails'

export type CoinFlipResponse = {
  message: string
  result: CoinFlipGuess
  winAmount: number
  betAmount: number
  wallet: number
}

export type SlotMachineResponse = {
  message: string
  symbols: [string, string, string]
  winAmount: number
  multiplier: number
  wallet: number
  result: string
}
