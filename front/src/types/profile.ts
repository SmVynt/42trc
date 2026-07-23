export type ProfileStatus = 'Online' | 'In-game' | 'Offline'

export type ProfileResult = 'Win' | 'Loss' | 'Draw'

export type ProfileAchievement = {
  id: string
  title: string
  description: string
  iconLabel: string
  unlocked: boolean
  unlockedAt?: string
}

export type ProfileActivity = {
  id: string
  mode: string
  result: ProfileResult
  score: string
  date: string
  opponent: string
}

export type ProfileEquipment = {
  fishingRod: string
  cosmetics: string[]
  badge: string
  title: string
}

export type StudentProfile = {
  id: string
  displayName: string
  intraLogin: string
  campus: string
  coalition: string
  host: string
  avatarUrl: string
  status: ProfileStatus
  friends: number
  level: number
  currentXp: number
  nextLevelXp: number
  gamesPlayed: number
  wins: number
  winRate: number
  wallet: number
  equipment: ProfileEquipment
  achievements: ProfileAchievement[]
  recentActivity: ProfileActivity[]
}
