import type { User } from '../types/user'
import type { StudentProfile, UserLevelRecord } from '../types/profile'

export const mockStudentProfile: StudentProfile = {
  id: '42-demo-hella',
  displayName: 'Astra Vale',
  intraLogin: 'avale',
  campus: '42 Paris',
  coalition: 'Pineapples United',
  host: 'South Cluster / Room 314',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80',
  status: 'In-game',
  friends: 86,
  level: 12.8,
  currentXp: 640,
  nextLevelXp: 900,
  projects: 18,
  exams: 3,
  stars: 42,
  points: 1280,
  gamesPlayed: 218,
  wins: 143,
  winRate: 65.6,
  wallet: 4200,
  equipment: {
    fishingRod: 'Nebula Rod Mk. II',
    cosmetics: ['Aurora Hoodie', 'Quartz Boots', 'Pixel Float'],
    badge: 'Night Shift Champion',
    title: 'Dockside Duelist',
  },
  achievements: [
    {
      id: 'first-catch',
      title: 'First Catch',
      description: 'Won the very first mini-game session.',
      iconLabel: 'FC',
      unlocked: true,
      unlockedAt: '2026-05-14',
    },
    {
      id: 'social-butterfly',
      title: 'Social Butterfly',
      description: 'Reached 75 friends in the hub.',
      iconLabel: 'SB',
      unlocked: true,
      unlockedAt: '2026-06-02',
    },
    {
      id: 'perfect-run',
      title: 'Perfect Run',
      description: 'Won three games in a row without a loss.',
      iconLabel: 'PR',
      unlocked: true,
      unlockedAt: '2026-06-21',
    },
    {
      id: 'legendary-lure',
      title: 'Legendary Lure',
      description: 'Equipped a rare fishing rod skin.',
      iconLabel: 'LL',
      unlocked: false,
    },
    {
      id: 'coalition-mvp',
      title: 'Coalition MVP',
      description: 'Ended the week at the top of the coalition board.',
      iconLabel: 'MVP',
      unlocked: true,
      unlockedAt: '2026-07-01',
    },
    {
      id: 'matchmaker',
      title: 'Matchmaker',
      description: 'Invited five friends to a game session.',
      iconLabel: 'MM',
      unlocked: true,
      unlockedAt: '2026-07-11',
    },
  ],
  recentActivity: [
    {
      id: 'act-1',
      mode: 'Fishing Frenzy',
      result: 'Win',
      score: '18 - 11',
      date: '2026-07-21',
      opponent: 'Lumi Drift',
    },
    {
      id: 'act-2',
      mode: 'Coin Flip Clash',
      result: 'Loss',
      score: '7 - 9',
      date: '2026-07-19',
      opponent: 'Kiro Static',
    },
    {
      id: 'act-3',
      mode: 'Habbo Drift',
      result: 'Draw',
      score: '12 - 12',
      date: '2026-07-17',
      opponent: 'Avery Moss',
    },
    {
      id: 'act-4',
      mode: 'Dock Rush',
      result: 'Win',
      score: '4 - 2',
      date: '2026-07-15',
      opponent: 'Nova Bloom',
    },
  ],
}

const calculateWinRate = (wins: number, gamesPlayed: number): number => {
  if (gamesPlayed <= 0) {
    return 0
  }

  return Math.round((wins / gamesPlayed) * 1000) / 10
}

const deriveLevelProgress = (level: number): Pick<StudentProfile, 'level' | 'currentXp' | 'nextLevelXp'> => {
  const normalizedLevel = Math.max(0, level)
  const fractional = normalizedLevel - Math.floor(normalizedLevel)

  return {
    level: Math.round(normalizedLevel * 10) / 10,
    currentXp: Math.round(fractional * 1000),
    nextLevelXp: 1000,
  }
}

const resolveLevelRecord = (user?: User | null, levelRecord?: UserLevelRecord | null): UserLevelRecord | null => {
  if (!user || !levelRecord) {
    return null
  }

  const userNames = [user.username, user.intra, user.displayname]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim().toLowerCase())

  const recordNames = [levelRecord.username, levelRecord.displayname].map((value) => value.trim().toLowerCase())

  return userNames.some((name) => recordNames.includes(name)) ? levelRecord : null
}

const resolveProfileStatus = (user?: User | null): StudentProfile['status'] => {
  if (!user?.lastLoginAt) {
    return mockStudentProfile.status
  }

  const lastLoginAt = Date.parse(user.lastLoginAt)
  if (Number.isNaN(lastLoginAt)) {
    return mockStudentProfile.status
  }

  const elapsedMinutes = (Date.now() - lastLoginAt) / 60_000
  return elapsedMinutes <= 30 ? 'Online' : 'Offline'
}

export const buildStudentProfile = (user?: User | null, levelRecord?: UserLevelRecord | null): StudentProfile => {
  const matchedLevelRecord = resolveLevelRecord(user, levelRecord)
  const gamesPlayed = user?.stats?.gamesPlayed ?? mockStudentProfile.gamesPlayed
  const wins = user?.stats?.wins ?? mockStudentProfile.wins
  const points = user?.stats?.points ?? mockStudentProfile.points
  const derivedLevel = matchedLevelRecord ? deriveLevelProgress(matchedLevelRecord.level) : null
  const wallet = user?.wallet ?? mockStudentProfile.wallet

  return {
    ...mockStudentProfile,
    id: String(user?.id ?? mockStudentProfile.id),
    displayName: user?.displayname?.trim() || mockStudentProfile.displayName,
    intraLogin: user?.intra?.trim() || user?.username?.trim() || mockStudentProfile.intraLogin,
    avatarUrl: user?.image?.trim() || mockStudentProfile.avatarUrl,
    status: resolveProfileStatus(user),
    wallet,
    level: derivedLevel?.level ?? mockStudentProfile.level,
    currentXp: derivedLevel?.currentXp ?? mockStudentProfile.currentXp,
    nextLevelXp: derivedLevel?.nextLevelXp ?? mockStudentProfile.nextLevelXp,
    projects: matchedLevelRecord?.projects ?? mockStudentProfile.projects,
    exams: matchedLevelRecord?.exams ?? mockStudentProfile.exams,
    stars: matchedLevelRecord?.stars ?? mockStudentProfile.stars,
    points,
    gamesPlayed,
    wins,
    winRate: calculateWinRate(wins, gamesPlayed),
  }
}
