import { http } from '../../api/http'
import type { AuthResponse, User } from '../../types/auth'

export const authService = {
  async me(token: string): Promise<User> {
    const res = await http<AuthResponse>('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return res.user
  },

  async oauth42(code: string, state: string): Promise<AuthResponse> {
    return http<AuthResponse>('/api/auth/oauth/42/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    })
  },
}
