import type { ProfileActivity } from '../../types/profile'

type ActivityHistoryProps = {
  activities: ProfileActivity[]
}

const resultLabelClass: Record<ProfileActivity['result'], string> = {
  Win: 'activity-result--win',
  Loss: 'activity-result--loss',
  Draw: 'activity-result--draw',
}

const ActivityHistory = ({ activities }: ActivityHistoryProps): JSX.Element => {
  return (
    <section className="profile-card panel-surface profile-card--tall">
      <p className="profile-kicker profile-kicker--secondary">Recent activity</p>
      <h2>Match / activity history</h2>
      <p className="profile-card__description">
        Clean timeline of the latest matches, including mode, outcome and score.
      </p>

      <div className="profile-table-wrap">
        <table className="profile-table">
          <thead>
            <tr>
              <th scope="col">Mode</th>
              <th scope="col">Result</th>
              <th scope="col">Score</th>
              <th scope="col">Opponent</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id}>
                <td>
                  <strong>{activity.mode}</strong>
                </td>
                <td>
                  <span className={`activity-result ${resultLabelClass[activity.result]}`}>{activity.result}</span>
                </td>
                <td>{activity.score}</td>
                <td>{activity.opponent}</td>
                <td>{activity.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ActivityHistory
