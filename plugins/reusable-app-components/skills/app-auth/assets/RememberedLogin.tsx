"use client"

import { useState, type ReactNode } from "react"
import type { LoginProfile } from "./login"
import "./auth-panel.css"

export function RememberedLogin({ profile, continueWith, copy, children, title, footer }: {
  title?: string
  footer?: ReactNode
  profile: LoginProfile | null
  continueWith: (profile: LoginProfile, badge: ReactNode) => ReactNode
  copy: { lastUsed: string, anotherProfile: string, savedProfile: string, or: string }
  children: (email: string) => ReactNode
}) {
  const [email, setEmail] = useState<string | null>(null)
  const badge = <span className="app-remembered-login__badge">{copy.lastUsed}</span>
  return <div className="app-remembered-login">
    {profile && email === null ? <>
      {title ? <h2>{title}</h2> : null}
      <div className="app-remembered-login__profile">
        {profile.method === "email" ? <button type="button" title={profile.email} onClick={() => setEmail(profile.email)}><span className="app-social-sign-in__label">{profile.email}</span>{badge}</button> : continueWith(profile, badge)}
      </div>
      <div className="app-auth-divider" aria-hidden="true">{copy.or}</div>
      <button type="button" className="app-remembered-login__switch" onClick={() => setEmail("")}>{copy.anotherProfile}</button>
      {footer ? <div className="app-remembered-login__footer">{footer}</div> : null}
    </> : <>
      {children(email ?? "")}
      {profile ? <button type="button" className="app-remembered-login__switch" onClick={() => setEmail(null)}>{copy.savedProfile}</button> : null}
    </>}
  </div>
}
