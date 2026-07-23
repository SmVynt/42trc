type StatItem = {
  label: string
  value: string
}

type StatsCardProps = {
  title: string
  eyebrow: string
  description: string
  items: StatItem[]
}

const StatsCard = ({ title, eyebrow, description, items }: StatsCardProps): JSX.Element => {
  return (
    <section className="profile-card panel-surface">
      <p className="profile-kicker profile-kicker--secondary">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="profile-card__description">{description}</p>

      <dl className="profile-stat-list">
        {items.map((item) => (
          <div key={item.label} className="profile-stat-list__item">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default StatsCard
