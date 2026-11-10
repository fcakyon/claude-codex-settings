import type { OAuthProvider } from "./auth"

type PocketBaseAuthMethods = {
  password: { enabled: boolean, identityFields: string[] }
  oauth2: {
    enabled: boolean
    providers: { name: string, displayName: string }[]
  }
}

export function pocketBaseAuthMethods(
  methods: PocketBaseAuthMethods,
  endpoint: (provider: string) => string,
): { emailPassword: boolean, providers: OAuthProvider[] } {
  return {
    emailPassword: methods.password.enabled && methods.password.identityFields.includes("email"),
    providers: methods.oauth2.enabled ? methods.oauth2.providers.map(provider => ({
      id: provider.name,
      label: provider.displayName,
      endpoint: endpoint(provider.name),
    })) : [],
  }
}
