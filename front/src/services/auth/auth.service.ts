import { http } from '../../api/http'
import type { User } from '../../types/user'

export const authService = {
  async me(token: string): Promise<User> {
    const res = await http<{ user: User }>('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return res.user
  },

  async testLogin(username: string): Promise<{ user: User; token: string }> {
    return await http<{ user: User; token: string }>('/api/auth/test-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    })
  },

  async buyItem(token: string, itemId: string, category: string, price: number): Promise<{ user: User; message: string }> {
    return await http<{ user: User; message: string }>('/api/users/me/buy-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemId, category, price }),
    })
  },
}
