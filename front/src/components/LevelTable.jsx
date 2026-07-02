import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

function LevelTable() {
	const [users, setUsers] = useState([])
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const load = async () => {
			try {
				const res = await fetch(`${API_BASE}/api/users/levels`)
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				const data = await res.json()
				setUsers(data.users || [])
			} catch (err) {
				setError(err.message)
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [])

	if (loading) return <p>Loading...</p>
	if (error) return <p>Error: {error}</p>

	return (
		<table>
			<thead>
				<tr>
					<th>#</th>
					<th>Nickname</th>
					<th>Name</th>
					<th>Level</th>
					<th>Projects</th>
					<th>Exams</th>
					<th>Outstanding</th>
				</tr>
			</thead>
			<tbody>
				{users.map((u, i) => (
					<tr key={u.username}>
						<td>{i + 1}</td>
						<td>{u.username}</td>
						<td>{u.displayname}</td>
						<td>{u.level ?? '-'}</td>
						<td>{u.projects}</td>
						<td>{u.exams}</td>
						<td>{u.stars}</td>
					</tr>
				))}
			</tbody>
		</table>
	)
}

export default LevelTable
