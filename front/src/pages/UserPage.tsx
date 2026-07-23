import '../components/profile/profile.css'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { buildStudentProfile } from '../mocks/profile.mock'
import { profileService } from '../services/profile/profile.service'
import ProfileHeader from '../components/profile/ProfileHeader'
import StatsCard from '../components/profile/StatsCard'
import AchievementGrid from '../components/profile/AchievementGrid'
import ActivityHistory from '../components/profile/ActivityHistory'
import type { UserLevelRecord } from '../types/profile'

const UserPage = () => {
  const { user, loading } = useAuth()
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [levels, setLevels] = useState<UserLevelRecord[]>([])
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadLevels = async () => {
      setProfileLoading(true)
      setProfileError(null)

      try {
        const users = await profileService.getUserLevels()

        if (isMounted) {
          setLevels(users)
        }
      } catch (error) {
        if (isMounted) {
          setProfileError(error instanceof Error ? error.message : 'Failed to load leaderboard data.')
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false)
        }
      }
    }

    loadLevels()

    return () => {
      isMounted = false
    }
  }, [])

  const levelRecord = useMemo(() => {
    if (!user) {
      return null
    }

    const userNames = [user.username, user.intra, user.displayname]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim().toLowerCase())

    return levels.find((entry) => {
      const entryNames = [entry.username, entry.displayname].map((value) => value.trim().toLowerCase())
      return userNames.some((name) => entryNames.includes(name))
    }) ?? null
  }, [levels, user])

  const profile = buildStudentProfile(user, levelRecord)
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
          <strong>Preview mode:</strong> no authenticated user was found, so the page is showing mock social data with live leaderboard sync.
        </section>
      ) : null}

      {profileError ? (
        <section className="profile-banner panel-surface" aria-label="Profile sync warning">
          <strong>Profile sync warning:</strong> {profileError}
        </section>
      ) : null}

      <ProfileHeader
        profile={profile}
        previewMode={previewMode}
        actionMessage={actionMessage}
        onAction={handleAction}
      />

      {profileLoading ? (
        <section className="profile-banner panel-surface" aria-label="Profile refresh status">
          Syncing leaderboard data...
        </section>
      ) : null}

      <section className="profile-layout">
        <StatsCard
          eyebrow="Mini-game stats"
          title="Competitive snapshot"
          description="Core session metrics that summarize activity across the hub."
          items={[
            { label: 'Games played', value: profile.gamesPlayed.toString() },
            { label: 'Wins', value: profile.wins.toString() },
            { label: 'Win-rate', value: `${profile.winRate.toFixed(1)}%` },
            { label: 'Points', value: profile.points.toString() },
            { label: 'Wallet', value: `${profile.wallet}₳` },
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

        <StatsCard
          eyebrow="Academic snapshot"
          title="42 progress summary"
          description="Live data from the leaderboard endpoint matched to the current account when available."
          items={[
            { label: 'Level', value: profile.level.toFixed(1) },
            { label: 'Projects', value: profile.projects.toString() },
            { label: 'Exams', value: profile.exams.toString() },
            { label: 'Stars', value: profile.stars.toString() },
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
