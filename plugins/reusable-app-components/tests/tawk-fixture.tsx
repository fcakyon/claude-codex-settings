import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { TawkSupport, type SupportIdentity, type TawkApi } from "../skills/tawk-support/assets/TawkSupport";

function Fixture() {
  const [account, setAccount] = useState<string | null>(null);
  const [mounted, setMounted] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState("");
  const [chat, setChat] = useState("Guest");
  const [history, setHistory] = useState<string[]>([]);
  const [version, setVersion] = useState("");
  const [visible, setVisible] = useState(false);
  const api = useMemo<TawkApi>(() => ({
    login(identity, done) {
      setChat(identity.email); setHistory(previous => [...previous, identity.email]);
      setVersion(identity["browser-release"]); done();
    },
    logout(done) { setChat("Guest"); done(); },
    setAttributes(attributes, done) { setVersion(attributes["browser-release"]); done(); },
    minimize() {}, hideWidget() { setVisible(false); }, showWidget() { setVisible(true); },
  }), []);
  useEffect(() => { setReady(true); }, []);
  const change = (next: string | null) => {
    document.cookie = "fixture-account=" + (next || "") + ";path=/";
    setAccount(next);
  };
  return <main>
    <button onClick={() => change("a")}>Account A</button>
    <button onClick={() => change("b")}>Account B</button>
    <button onClick={() => change(null)}>Log out</button>
    <button onClick={() => setMounted(false)}>Close owner</button>
    <button onClick={() => setHidden(value => !value)}>Toggle hidden</button>
    <button onClick={() => setReady(value => !value)}>Toggle SDK</button>
    <button onClick={() => api.onChatMaximized?.()}>Open chat</button>
    {mounted ? <TawkSupport api={ready ? api : null} accountKey={account}
      hidden={hidden} attributes={{"browser-release":"v156.0.0.0","device-type":"desktop"}}
      resolveIdentity={async signal => {
        const response = await fetch("/identity" + window.location.search, {signal});
        if (!response.ok) throw new Error("Private transport diagnostics");
        return response.status === 204 ? null : response.json() as Promise<SupportIdentity>;
      }} onFailure={() => setFailure("Support could not sync. Try again.")} /> : null}
    <p role="status">{chat}</p><p>{version}</p>
    <div role="log" aria-label="Identity history">{history.join(",")}</div>
    <div aria-label="Chat widget" hidden={!visible}>Support widget</div>
    {failure ? <p role="alert">{failure}</p> : null}
  </main>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
