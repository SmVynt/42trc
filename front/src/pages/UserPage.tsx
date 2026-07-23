import '../components/profile/profile.css'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { buildStudentProfile } from '../mocks/profile.mock'
import ProfileHeader from '../components/profile/ProfileHeader'
import StatsCard from '../components/profile/StatsCard'
import AchievementGrid from '../components/profile/AchievementGrid'
import ActivityHistory from '../components/profile/ActivityHistory'

const UserPage = (): JSX.Element => {
  const { user, loading } = useAuth()
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const profile = buildStudentProfile(user)
  const previewMode = !user

  const handleAction = (action: 'friend' | 'message' | 'invite') => {
    const messages: Record<typeof action, string> = {
      friend: 'Friend request queued locally for preview mode.',
      message: 'Message composer is ready for the future chat integration.',
      invite: 'Game invite staged. Hook this up to the lobby service later.',
    }

    setActionMessage(messages[action])
  }

  if (loading) {
    return (
      <main className="profile-page profile-page--loading">
        <section className="profile-card panel-surface">
          <p className="profile-kicker profile-kicker--secondary">Loading profile</p>
          <h1>Preparing the student card...</h1>
          <p className="profile-card__description">Waiting for auth state and profile data.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="profile-page">
      {previewMode ? (
        <section className="profile-banner panel-surface" aria-label="Preview notice">
          <strong>Preview mode:</strong> the page is using mock profile data until the full backend profile endpoint is wired.
        </section>
      ) : null}

      <ProfileHeader
        profile={profile}
        previewMode={previewMode}
        actionMessage={actionMessage}
        onAction={handleAction}
      />

      <section className="profile-layout">
        <StatsCard
          eyebrow="Mini-game stats"
          title="Competitive snapshot"
          description="Core session metrics that summarize activity across the hub."
          items={[
            { label: 'Games played', value: profile.gamesPlayed.toString() },
            { label: 'Wins', value: profile.wins.toString() },
            { label: 'Win-rate', value: `${profile.winRate.toFixed(1)}%` },
          ]}
        />

        <StatsCard
          eyebrow="Equipment summary"
          title="Wardrobe and badge loadout"
          description="A compact view of the equipped fishing setup, cosmetics and title."
          items={[
            { label: 'Fishing rod', value: profile.equipment.fishingRod },
            { label: 'Cosmetics', value: profile.equipment.cosmetics.join(', ') },
            { label: 'Badge', value: profile.equipment.badge },
            { label: 'Title', value: profile.equipment.title },
          ]}
        />
      </section>

      <section className="profile-grid-two-up">
        <AchievementGrid achievements={profile.achievements} />
        <ActivityHistory activities={profile.recentActivity} />
      </section>
    </main>
  )
}

export default UserPage
