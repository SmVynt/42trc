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
}
