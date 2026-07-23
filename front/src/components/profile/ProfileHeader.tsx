import type { ReactElement } from 'react'
import type { StudentProfile } from '../../types/profile'

type ProfileHeaderProps = {
  profile: StudentProfile
  previewMode: boolean
  actionMessage: string | null
  onAction: (action: 'friend' | 'message' | 'invite') => void
}

const statusClassMap: Record<StudentProfile['status'], string> = {
  Online: 'profile-status--online',
  'In-game': 'profile-status--ingame',
  Offline: 'profile-status--offline',
}

const actionLabels: Record<'friend' | 'message' | 'invite', string> = {
  friend: 'Add Friend',
  message: 'Send Message',
  invite: 'Invite to Game',
}

const ProfileHeader = ({ profile, previewMode, actionMessage, onAction }: ProfileHeaderProps): ReactElement => {
  const progressPercent = Math.min(100, Math.round((profile.currentXp / profile.nextLevelXp) * 100))

  return (
    <section className="profile-hero panel-surface">
      <div className="profile-hero__glow" aria-hidden="true" />

      <div className="profile-hero__topline">
        <span className="profile-kicker">42 Student ID Card</span>
        <span className="profile-chip profile-chip--muted">
          {previewMode ? 'Mock preview' : 'Linked 42 account'}
        </span>
      </div>

      <div className="profile-hero__body">
        <div className="profile-avatar">
          <img src={profile.avatarUrl} alt={`${profile.displayName} avatar`} className="profile-avatar__image" />
          <span className={`profile-status ${statusClassMap[profile.status]}`}>{profile.status}</span>
        </div>

        <div className="profile-hero__identity">
          <p className="profile-kicker profile-kicker--secondary">42 intra login</p>
          <h1>{profile.displayName}</h1>
          <p className="profile-hero__subtitle">
            @{profile.intraLogin} · {profile.campus} · {profile.coalition}
          </p>

          <div className="profile-meta-row" aria-label="Student quick facts">
            <span>Host: {profile.host}</span>
            <span>Friends: {profile.friends}</span>
            <span>Projects: {profile.projects}</span>
            <span>Exams: {profile.exams}</span>
            <span>Stars: {profile.stars}</span>
            <span>Points: {profile.points}</span>
            <span>Wallet: {profile.wallet}₳</span>
          </div>
        </div>

        <div className="profile-hero__actions" aria-label="Quick actions">
          {(Object.keys(actionLabels) as Array<keyof typeof actionLabels>).map((actionKey) => (
            <button key={actionKey} type="button" className="profile-button" onClick={() => onAction(actionKey)}>
              {actionLabels[actionKey]}
            </button>
          ))}
        </div>
      </div>

      <div className="profile-hero__stats">
        <div className="profile-stat-pill">
          <span>Level</span>
          <strong>{profile.level.toFixed(1)}</strong>
        </div>
        <div className="profile-stat-pill">
          <span>Projects</span>
          <strong>{profile.projects}</strong>
        </div>
        <div className="profile-stat-pill">
          <span>Points</span>
          <strong>{profile.points}</strong>
        </div>
        <div className="profile-stat-pill">
          <span>Games</span>
          <strong>{profile.gamesPlayed}</strong>
        </div>
        <div className="profile-stat-pill">
          <span>Wins</span>
          <strong>{profile.wins}</strong>
        </div>
        <div className="profile-stat-pill">
          <span>Win-rate</span>
          <strong>{profile.winRate.toFixed(1)}%</strong>
        </div>
      </div>

      <div className="profile-progress">
        <div className="profile-progress__label">
          <span>XP progress</span>
          <span>
            {profile.currentXp} / {profile.nextLevelXp} XP
          </span>
        </div>
        <div className="profile-progress__track" aria-hidden="true">
          <span className="profile-progress__fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {actionMessage ? <p className="profile-hero__message">{actionMessage}</p> : null}
    </section>
  )
}

export default ProfileHeader
