export type LoginProfile = { email: string, method: string }

export function socialLoginUrl(endpoint: string, returnTo: string, email?: string) {
  return `${endpoint}?${new URLSearchParams({ returnTo, ...(email ? { login_hint: email } : { prompt: "select_account" }) })}`
}

export function lastLogin(storage: Storage, key: string) {
  return {
    read(): LoginProfile | null {
      const email = storage.getItem(`${key}.email`)
      const method = storage.getItem(`${key}.method`)
      return email && method ? { email, method } : null
    },
    save(profile: LoginProfile | null) {
      if (profile) {
        storage.setItem(`${key}.email`, profile.email)
        storage.setItem(`${key}.method`, profile.method)
      } else {
        storage.removeItem(`${key}.email`)
        storage.removeItem(`${key}.method`)
      }
    },
  }
}
