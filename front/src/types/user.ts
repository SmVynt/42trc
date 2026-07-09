export type User = {
  id?: string
  email?: string
  username?: string
  displayname?: string
  wallet?: number
  stats?: {
    gamesPlayed?: number
    wins?: number
    points?: number
  }
}
