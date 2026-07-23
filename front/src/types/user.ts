export type UserStats = {
  gamesPlayed?: number
  wins?: number
  points?: number
}

export type User = {
  id?: number
  email?: string
  username?: string
  intra?: string
  displayname?: string
  image?: string
  wallet?: number
  emailVerifiedAt?: string | null
  lastLoginAt?: string | null
  stats?: UserStats
}
