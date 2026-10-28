import { useState } from "react";
import {
  EmailAuth,
  type EmailAuthCopy,
} from "../skills/app-auth/assets/EmailAuth";
import "../skills/app-auth/assets/auth-panel.css";

const english: EmailAuthCopy = {
  titles: {
    login: "Welcome back",
    signup: "Create your account",
    forgot: "Reset your password",
    verify: "Check your email",
    password: "Choose a new password",
  },
  email: "Email",
  password: "Password",
  newPassword: "New password",
  showPassword: "Show",
  hidePassword: "Hide",
  login: "Log in",
  signup: "Get started",
  continue: "Continue",
  forgot: "Forgot password?",
  sendCode: "Send code",
  resend: "Send a new code",
  savePassword: "Save password",
  changeEmail: "Use another email",
  pending: "Working…",
  code: "Code",
  codeSent: (email) => `Enter the code sent to ${email}.`,
};
const turkish: EmailAuthCopy = {
  titles: {
    login: "Tekrar hoş geldin",
    signup: "Hesabını oluştur",
    forgot: "Şifreni sıfırla",
    verify: "E-postanı kontrol et",
    password: "Yeni şifreni seç",
  },
  email: "E-posta",
  password: "Şifre",
  newPassword: "Yeni şifre",
  showPassword: "Göster",
  hidePassword: "Gizle",
  login: "Giriş yap",
  signup: "Başla",
  continue: "Devam et",
  forgot: "Şifremi unuttum?",
  sendCode: "Kod gönder",
  resend: "Yeni kod gönder",
  savePassword: "Şifreyi kaydet",
  changeEmail: "Başka e-posta kullan",
  pending: "İşleniyor…",
  code: "Kod",
  codeSent: (email) => `${email} adresine gönderilen kodu gir.`,
};
const query = new URLSearchParams(location.search);
const send = async <T,>(
  path: string,
  input: unknown,
  signal: AbortSignal,
): Promise<T> => {
  const response = await fetch("/email/" + path + location.search, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok) throw body;
  return body as T;
};
export function EmailFixture() {
  const [user, setUser] = useState("");
  const [visible, setVisible] = useState(true);
  return (
    <main>
      {visible && !user ? (
        <section className="app-auth-panel">
          <div className="app-auth-panel__brand"><img src="/example-logo.svg" alt="Example app" width={48} height={48} /></div>
          <EmailAuth<{ email: string }, { ticket: string }>
            initialMode={query.get("mode") === "signup" ? "signup" : "login"}
            copy={query.get("lang") === "tr" ? turkish : english}
            terms={
              query.get("lang") === "tr" ? (
                <span>
                  <a href="/terms">Koşulları</a> ve{" "}
                  <a href="/privacy">Gizlilik politikasını</a> kabul ediyorum.
                </span>
              ) : (
                <span>
                  I accept the <a href="/terms">Terms</a> and{" "}
                  <a href="/privacy">Privacy policy</a>.
                </span>
              )
            }
            adapter={{
              login: (input, signal) => send("login", input, signal),
              register: (input, signal) => send("register", input, signal),
              sendCode: (input, signal) => send("send-code", input, signal),
              verifyEmail: (input, signal) => send("verify", input, signal),
              verifyResetCode: (input, signal) =>
                send("verify-reset", input, signal),
              resetPassword: (input, signal) => send("reset", input, signal),
            }}
            onAuthenticated={(result) => setUser(result.email)}
            onFailure={(error) => {
              const reason = (
                error as { reason?: "email-exists" | "verification-needed" }
              ).reason;
              return {
                message:
                  reason === "email-exists"
                    ? "You already have an account."
                    : "That didn’t work. Try again.",
                reason,
              };
            }}
          />
        </section>
      ) : null}
      <p role="status">{user ? `Signed in as ${user}` : "Signed out"}</p>
      <button onClick={() => setVisible(!visible)}>
        {visible ? "Close email form" : "Open email form"}
      </button>
    </main>
  );
}
