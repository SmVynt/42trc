import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth/auth.service'
import type { User } from '../types/user'

const UserPage = (): JSX.Element => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const navigate = useNavigate()

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('authToken')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const user = await authService.me(token)
        setUser(user)
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [navigate])

  if (loading) {
    return <main style={{ padding: 24 }}>Loading...</main>
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>User</h1>
      <p>user is logged in</p>
      <p style={{ marginTop: 12 }}>{user?.email}</p>
    </main>
  )
}

export default UserPage
