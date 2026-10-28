import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { GoogleSignIn, type GoogleIdentity } from "../skills/app-auth/assets/GoogleSignIn";

import { EmailFixture } from "./email-fixture";
import { AuthPanel } from "../skills/app-auth/assets/AuthPanel";

const query = new URLSearchParams(location.search);
let deliver: (response: { credential: string }) => void;
const identity: GoogleIdentity = {
  initialize(options) { deliver = options.callback; },
  renderButton(parent) {
    const button = document.createElement("button");
    button.textContent = "Test Google sign-in";
    button.className = "fixture-google-button";
    button.onclick = () => deliver({ credential: "fixture-credential" });
    parent.append(button);
  },
};

function Fixture() {
  const [visible, setVisible] = useState(true);
  const [sdkAvailable, setSdkAvailable] = useState(query.get("sdk") !== "missing");
  const [account, setAccount] = useState("returning@example.test");
  const [session, setSession] = useState("");
  const [failures, setFailures] = useState(0);
  const [aborted, setAborted] = useState(false);
  const turkish = query.get("lang") === "tr";
  return <main>
    {visible ? <AuthPanel brand={<img src="/example-logo.svg" alt="Example app" width={48} height={48} />}
      title={turkish ? "Tekrar hoş geldin" : "Welcome back"}
      description={turkish ? "Hesabına devam et." : "Continue to your account."}
    ><GoogleSignIn
      identity={sdkAvailable ? identity : null}
      theme="filled_black"
      clientId="fixture-client"
      locale={turkish ? "tr" : "en"}
      accountHint={account}
      returnTo={query.get("returnTo") ?? "/workspace?filter=active#details"}
      redirectEndpoint="/auth/google/login"
      copy={turkish ? {
        fallback: "Sorun mu yaşıyorsun? Bu sekmede devam et",
        anotherAccount: "Başka bir Google hesabı kullan",
        pending: "Giriş yapılıyor…",
      } : {
        fallback: "Having trouble? Continue in this tab",
        anotherAccount: "Use a different Google account",
        pending: "Signing in…",
      }}
      onCredential={async (credential, signal) => {
        signal.addEventListener("abort", () => setAborted(true), { once: true });
        const response = await fetch("/session?" + query, {
          method: "POST", signal, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });
        if (!response.ok) throw Object.assign(new Error(await response.text()), { status: response.status });
        return await response.json() as { email: string };
      }}
      onAuthenticated={user => { setSession(user.email); setVisible(false); }}
      onFailure={error => {
        setFailures(value => value + 1);
        return (error as { status: number }).status === 429 ? "Please wait before retrying." : "Sign-in failed. Try again.";
      }}
      onUseAnotherAccount={() => setAccount("")}
    /></AuthPanel> : null}
    <p className="fixture-note">Component preview with a local test provider.</p>
    <details open>
    <summary>Test controls</summary>
    <button onClick={() => setVisible(!visible)}>{visible ? "Close sign-in" : "Open sign-in"}</button>
    <button onClick={() => deliver({ credential: "late-credential" })}>Deliver late SDK event</button>
    <button onClick={() => setSdkAvailable(false)}>Unload SDK</button>
    <p role="status">{session ? "Signed in as " + session : "Signed out"}</p>
    <p>Failures reported: {failures}</p>
    <p>Cancelled: {String(aborted)}</p>
    </details>
  </main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode>{query.has("email") ? <EmailFixture /> : <Fixture />}</StrictMode>);
