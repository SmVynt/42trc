import type { ProfileAchievement } from '../../types/profile'

type AchievementGridProps = {
  achievements: ProfileAchievement[]
}

const AchievementGrid = ({ achievements }: AchievementGridProps) => {
  return (
    <section className="profile-card panel-surface profile-card--tall">
      <p className="profile-kicker profile-kicker--secondary">Achievement showcase</p>
      <h2>Badges and titles</h2>
      <p className="profile-card__description">
        Hover a badge for the tooltip. Unlocked achievements are highlighted and can be used later for social flex.
      </p>

      <div className="achievement-grid">
        {achievements.map((achievement) => (
          <button
            key={achievement.id}
            type="button"
            className={`achievement-card ${achievement.unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}`}
            title={achievement.description}
            aria-label={`${achievement.title}: ${achievement.description}`}
          >
            <span className="achievement-card__icon" aria-hidden="true">
              {achievement.iconLabel}
            </span>
            <span className="achievement-card__title">{achievement.title}</span>
            <span className="achievement-card__meta">
              {achievement.unlocked ? `Unlocked${achievement.unlockedAt ? ` · ${achievement.unlockedAt}` : ''}` : 'Locked'}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default AchievementGrid
