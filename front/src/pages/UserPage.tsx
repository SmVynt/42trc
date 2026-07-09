import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

const UserPage = (): JSX.Element => {
  const { user, loading } = useAuth()

  if (loading) {
    return <main style={{ padding: 24 }}>Loading...</main>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>User</h1>
      <p>user is logged in</p>
      <p style={{ marginTop: 12 }}>{user.email}</p>
      <p style={{ marginTop: 12 }}>Wallet: {user.wallet ?? 0}</p>
    </main>
  )
}

export default UserPage
