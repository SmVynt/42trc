import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

const UserPage = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchMe = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (!token) {
        navigate('/login')
        return
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          navigate('/login')
          return
        }

        const data = await response.json()
        setUser(data.user)
      } catch (err) {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [navigate])

  if (loading) return <main style={{ padding: 24 }}>Loading...</main>

  return (
    <main style={{ padding: 24 }}>
      <h1>User</h1>
      <p>user is logged in</p>
      <p style={{ marginTop: 12 }}>{user?.email}</p>
    </main>
  )
}

export default UserPage
