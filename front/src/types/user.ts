export type User = {
  id?: string | number
  email?: string
  username?: string
  intra?: string
  displayname?: string
  image?: string
  wallet?: number
  equippedHat?: string
  equippedGlasses?: string
  equippedFace?: string
  stats?: {
    gamesPlayed: number
    wins: number
    points: number
  }
}
