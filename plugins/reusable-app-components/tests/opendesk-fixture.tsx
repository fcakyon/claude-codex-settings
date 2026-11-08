import { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"
import { OpenDeskSupport } from "../skills/opendesk-support/assets/OpenDeskSupport"

function Fixture() {
  const [account, setAccount] = useState<string | null>(null)
  const [mounted, setMounted] = useState(true)
  const [hidden, setHidden] = useState(false)
  const [language, setLanguage] = useState("en")
  const change = (next: string | null) => {
    document.cookie = `fixture-account=${next || ""}`
    setAccount(next)
  }
  return <main>
    <button onClick={() => change("a")}>Account A</button>
    <button onClick={() => change("b")}>Account B</button>
    <button onClick={() => change(null)}>Log out</button>
    <button onClick={() => setMounted(false)}>Unmount chat</button>
    <button onClick={() => setHidden(value => !value)}>Toggle hidden</button>
    <button onClick={() => setLanguage("ar")}>Arabic</button>
    {mounted && <OpenDeskSupport url={location.origin} widgetKey="public-fixture-key"
      identityUrl={`/identity${location.search}`} accountKey={account} language={language} hidden={hidden} />}
  </main>
}
createRoot(document.getElementById("root")!).render(<StrictMode><Fixture /></StrictMode>)
