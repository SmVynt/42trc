import { http } from '../../api/http'
import { tokenService } from '../../storage/token.service'
import type { CoinFlipGuess, CoinFlipResponse } from '../../types/gambling'

type CoinFlipRequest = {
  betAmount: number
  guess: CoinFlipGuess
}

export const gamblingService = {
  async playCoinFlip(payload: CoinFlipRequest): Promise<CoinFlipResponse> {
    const token = tokenService.get()

    if (!token) {
      throw new Error('Missing auth token.')
    }

    return http<CoinFlipResponse>('/api/gambling/coinflip', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
  },
}