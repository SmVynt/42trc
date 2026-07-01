import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types/user'
import { authService } from '../services/auth/auth.service'
import { tokenService } from '../storage/token.service'

type AuthContextType = {
  user: User | null
  loading: boolean
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = tokenService.get()

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const user = await authService.me(token)
        setUser(user)
      } catch {
        tokenService.remove()
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const logout = () => {
    tokenService.remove()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
