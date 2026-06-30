import type { User } from './user'

export type AuthResponse = {
  user: User
  token?: string
}
