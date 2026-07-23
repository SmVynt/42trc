import { http } from '../../api/http'
import type { UserLevelRecord } from '../../types/profile'

type UserLevelsResponse = {
  users: UserLevelRecord[]
}

export const profileService = {
  async getUserLevels(): Promise<UserLevelRecord[]> {
    const response = await http<UserLevelsResponse>('/api/users/levels')
    return response.users
  },
}
