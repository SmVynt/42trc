const TOKEN_KEY = 'authToken'

export const tokenService = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },

  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
  },

  remove() {
    localStorage.removeItem(TOKEN_KEY)
  },
}
