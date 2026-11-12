import { useState } from "react"
import { createRoot } from "react-dom/client"
import { EmailAuth, type EmailAuthCopy } from "../skills/app-auth/assets/EmailAuth"
import { AuthPanel } from "../skills/app-auth/assets/AuthPanel"
import { SocialSignIn, type SocialProvider } from "../skills/app-auth/assets/SocialSignIn"
import { RememberedLogin } from "../skills/app-auth/assets/RememberedLogin"
import { lastLogin } from "../skills/app-auth/assets/login"
import "./style.css"

const saved = lastLogin(localStorage, "auth-demo.last-login")
const query = new URLSearchParams(location.search)
const returnTo = query.get("returnTo") ?? "/workspace?view=projects#recent"
const providerId = location.pathname.split("/")[2] || "google"
const choices: SocialProvider[] = [
  { id: "google", label: "Google", endpoint: "/auth/google/login" },
  { id: "github", label: "GitHub", endpoint: "/auth/github/login" },
  { id: "apple", label: "Apple", endpoint: "/auth/apple/login" },
  { id: "huggingface", label: "Hugging Face", endpoint: "/auth/huggingface/login" },
]
const completed = query.get("complete")
if (!completed && location.pathname === "/") sessionStorage.setItem("auth-demo.remember", saved.read() ? "yes" : "no")
if (completed && sessionStorage.getItem("auth-demo.remember") === "yes") saved.save({ email: completed, method: query.get("method") || "google" })

const emailCopy: EmailAuthCopy = {
  titles: { login: "Sign in", signup: "Sign up", forgot: "Reset password", verify: "Check your email", password: "Choose a new password" },
  email: "Email", password: "Password", newPassword: "New password",
  showPassword: "Show password", hidePassword: "Hide password",
  login: "Sign in", signup: "Sign up", continue: "Continue", forgot: "Forgot password?",
  sendCode: "Send code", resend: "Send a new code", savePassword: "Save password",
  changeEmail: "Use another email", pending: "Working…", code: "Code",
  codeSent: email => `Enter the demo code 123456 for ${email}.`,
}

async function verifyDemoCode(input: { email: string, code: string }) {
  if (input.code !== "123456") throw new Error("Invalid demo code")
  return { email: input.email }
}

function Demo() {
  const [initialMode, setInitialMode] = useState<"login" | "signup">("login")
  const [enabled, setEnabled] = useState(() => choices.map(provider => provider.id))
  const [profile, setProfile] = useState(saved.read)
  const [remember, setRemember] = useState(() => Boolean(saved.read()))
  const [signedIn, setSignedIn] = useState(completed ?? "")
  const provider = location.pathname.startsWith("/auth/")
  const copy = { lastUsed: "Last used", anotherProfile: "Sign in with another profile", savedProfile: "View saved profile", or: "or" }
  return <main>

    <AuthPanel title={provider ? "Choose an account" : signedIn ? "You’re signed in" : undefined}>
      {provider ? <div className="chooser"><p>This local provider fixture demonstrates full-page navigation. No Google connection is made.</p>{[query.get("login_hint") || "jamie@example.test", "alex@example.test"].map(address => <a key={address} href={`/?${new URLSearchParams({ complete: address, returnTo, method: providerId })}`}>{address}<span>Continue →</span></a>)}<a href="/">Back to sign in</a></div> : signedIn ? <div className="success"><p>{signedIn}</p><p>Selected destination: <code>{returnTo}</code></p><button onClick={() => { history.replaceState(null, "", "/"); setSignedIn(""); setInitialMode("login"); setProfile(saved.read()) }}>Sign out</button></div> : <RememberedLogin title="Sign in" footer={<button className="signup-link" onClick={() => setInitialMode("signup")}>Don’t have an account? <span>Sign up</span></button>} profile={initialMode === "login" && (profile?.method === "email" || enabled.includes(profile?.method ?? "")) ? profile : null} copy={copy} continueWith={(last, badge) => <SocialSignIn providers={choices.filter(provider => provider.id === last.method).map(provider => ({ ...provider, label: last.email }))} returnTo={returnTo} email={last.email} trailing={badge} layout="labels" />}>
        {initialEmail => <EmailAuth<{ email: string }, { email: string }>
          key={initialEmail} initialMode={initialMode} initialEmail={initialEmail} copy={emailCopy}
          social={<><SocialSignIn providers={choices.filter(provider => enabled.includes(provider.id))} returnTo={returnTo} /><div className="app-auth-divider">{copy.or}</div></>}
          beforeSubmit={<label className="remember"><input type="checkbox" checked={remember} onChange={event => { setRemember(event.target.checked); sessionStorage.setItem("auth-demo.remember", event.target.checked ? "yes" : "no"); if(!event.target.checked) { saved.save(null); setProfile(null) } }} />Save email and login method on this device</label>}
          adapter={{
            login: async input => ({ email: input.email }),
            register: async () => {},
            sendCode: async () => {},
            verifyEmail: verifyDemoCode,
            verifyResetCode: verifyDemoCode,
            resetPassword: async input => input.recovery,
          }}
          onAuthenticated={user => { saved.save(remember ? { email: user.email, method: "email" } : null); setProfile(saved.read()); setSignedIn(user.email) }}
          onFailure={() => ({ message: "Use the demo code 123456." })}
        />}
      </RememberedLogin>}

    </AuthPanel>
    <aside><details><summary>Demo provider configuration</summary>{choices.map(provider => <label className="remember" key={provider.id}><input type="checkbox" checked={enabled.includes(provider.id)} onChange={event => setEnabled(event.target.checked ? [...enabled, provider.id] : enabled.filter(id => id !== provider.id))} />{provider.label}</label>)}</details><p>Local preview. All sign-in methods are simulated. Verification code: 123456.</p><button onClick={() => { saved.save({ email: "jamie@example.test", method: "google" }); setProfile(saved.read()); sessionStorage.setItem("auth-demo.remember", "yes"); setSignedIn(""); setInitialMode("login") }}>Load example saved profile</button><button onClick={() => { saved.save(null); setProfile(null); sessionStorage.removeItem("auth-demo.remember"); setRemember(false) }}>Forget saved profile</button></aside>
  </main>
}

createRoot(document.getElementById("root")!).render(<Demo />)
