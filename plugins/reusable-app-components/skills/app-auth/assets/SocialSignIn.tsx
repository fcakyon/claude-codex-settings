"use client"

import type { ReactNode } from "react"
import type { OAuthProvider } from "./auth"
import { socialLoginUrl } from "./login"
import { ProviderLogo, providerLogos } from "./ProviderLogo"
import "./social-sign-in.css"

export type SocialProvider = OAuthProvider & {
  icon?: ReactNode
}

export function SocialSignIn({ providers, returnTo, email, layout = providers.length > 1 ? "icons" : "labels", trailing }: {
  providers: SocialProvider[]
  returnTo: string
  email?: string
  layout?: "icons" | "labels"
  trailing?: ReactNode
}) {
  return <div className={`app-social-sign-in app-social-sign-in--${layout}`}>
    {providers.map(provider => <a key={provider.id} href={socialLoginUrl(provider.endpoint, returnTo, email)} aria-label={provider.label} title={provider.label}>
      {provider.icon ?? (providerLogos[provider.id] ? <ProviderLogo provider={provider.id} /> : null)}
      <span className={layout === "icons" && (provider.icon || providerLogos[provider.id]) ? "app-social-sign-in__sr-label" : "app-social-sign-in__label"}>{provider.label}</span>
      {trailing}
    </a>)}
  </div>
}
