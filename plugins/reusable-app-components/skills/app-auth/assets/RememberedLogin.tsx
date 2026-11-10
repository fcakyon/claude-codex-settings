"use client"

import { useState, type ReactNode } from "react"
import type { LoginProfile } from "./login"
import "./auth-panel.css"

export function RememberedLogin({ profile, continueWith, copy, children, title, footer }: {
  title?: string
  footer?: ReactNode
  profile: LoginProfile | null
  continueWith: (profile: LoginProfile, badge: ReactNode) => ReactNode
  copy: { lastUsed: string, anotherProfile: string, savedProfile: string }
  children: (email: string) => ReactNode
}) {
  const [view, setView] = useState<"saved" | "full" | "email">("saved")
  const badge = <span className="app-remembered-login__badge">{copy.lastUsed}</span>
  return <div className="app-remembered-login">
    {profile && view === "saved" ? <>
      {title ? <h2>{title}</h2> : null}
      <div className="app-remembered-login__profile">
        {profile.method === "email" ? <button type="button" onClick={() => setView("email")}>{profile.email}{badge}</button> : continueWith(profile, badge)}
      </div>
      <div className="app-auth-divider" aria-hidden="true">or</div>
      <button type="button" className="app-remembered-login__switch" onClick={() => setView("full")}>{copy.anotherProfile}</button>
      {footer ? <div className="app-remembered-login__footer">{footer}</div> : null}
    </> : <>
      {children(view === "email" ? profile!.email : "")}
      {profile ? <button type="button" className="app-remembered-login__switch" onClick={() => setView("saved")}>{copy.savedProfile}</button> : null}
    </>}
  </div>
}
