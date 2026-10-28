"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import "./email-auth.css";

type Purpose = "signup" | "reset";
type Phase = "login" | "signup" | "forgot" | "verify" | "password";
type Failure = {
  message: string;
  reason?: "email-exists" | "verification-needed";
};
export type EmailAuthCopy = {
  titles: Record<Phase, string>;
  email: string;
  password: string;
  newPassword: string;
  showPassword: string;
  hidePassword: string;
  login: string;
  signup: string;
  continue: string;
  forgot: string;
  sendCode: string;
  resend: string;
  savePassword: string;
  changeEmail: string;
  pending: string;
  code: string;
  codeSent: (email: string) => string;
};
export type EmailAuthAdapter<User, Recovery> = {
  login: (
    input: { email: string; password: string },
    signal: AbortSignal,
  ) => Promise<User>;
  register: (
    input: { email: string; password: string; acceptedTerms: boolean },
    signal: AbortSignal,
  ) => Promise<void>;
  sendCode: (
    input: { email: string; purpose: Purpose },
    signal: AbortSignal,
  ) => Promise<void>;
  verifyEmail: (
    input: { email: string; code: string },
    signal: AbortSignal,
  ) => Promise<User>;
  verifyResetCode: (
    input: { email: string; code: string },
    signal: AbortSignal,
  ) => Promise<Recovery>;
  resetPassword: (
    input: { recovery: Recovery; password: string },
    signal: AbortSignal,
  ) => Promise<User>;
};

export function EmailAuth<User, Recovery>({
  adapter,
  copy,
  terms,
  initialMode = "login",
  initialEmail = "",
  minPasswordLength = 8,
  onAuthenticated,
  onFailure,
}: {
  adapter: EmailAuthAdapter<User, Recovery>;
  copy: EmailAuthCopy;
  terms?: ReactNode;
  initialMode?: "login" | "signup";
  initialEmail?: string;
  minPasswordLength?: number;
  onAuthenticated: (user: User) => void;
  onFailure: (error: unknown) => Failure;
}) {
  const id = useId();
  const [phase, setPhase] = useState<Phase>(initialMode);
  const [purpose, setPurpose] = useState<Purpose>("signup");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const recovery = useRef<Recovery>(null!);
  const operation = useRef<AbortController | null>(null);
  useEffect(() => () => operation.current?.abort(), []);

  const move = (next: Phase) => {
    setFailure(null);
    setPassword("");
    setCode("");
    setVisible(false);
    setPhase(next);
  };
  const perform = async (work: (signal: AbortSignal) => Promise<void>) => {
    const controller = new AbortController();
    operation.current = controller;
    setPending(true);
    setFailure(null);
    try {
      await work(controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) setFailure(onFailure(error));
    } finally {
      if (!controller.signal.aborted) setPending(false);
    }
  };
  const requestCode = (nextPurpose: Purpose) =>
    perform(async (signal) => {
      await adapter.sendCode({ email, purpose: nextPurpose }, signal);
      if (signal.aborted) return;
      setPurpose(nextPurpose);
      move("verify");
    });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (phase === "forgot") {
      void requestCode("reset");
      return;
    }
    void perform(async (signal) => {
      if (phase === "login") {
        const user = await adapter.login({ email, password }, signal);
        if (!signal.aborted) onAuthenticated(user);
      } else if (phase === "signup") {
        await adapter.register({ email, password, acceptedTerms }, signal);
        if (!signal.aborted) {
          setPurpose("signup");
          move("verify");
        }
      } else if (phase === "verify" && purpose === "reset") {
        const verified = await adapter.verifyResetCode({ email, code }, signal);
        if (!signal.aborted) {
          recovery.current = verified;
          move("password");
        }
      } else if (phase === "verify") {
        const user = await adapter.verifyEmail({ email, code }, signal);
        if (!signal.aborted) onAuthenticated(user);
      } else {
        const user = await adapter.resetPassword(
          { recovery: recovery.current, password },
          signal,
        );
        if (!signal.aborted) onAuthenticated(user);
      }
    });
  };
  const passwordPhase =
    phase === "login" || phase === "signup" || phase === "password";
  return (
    <form className="app-email-auth" onSubmit={submit} aria-busy={pending}>
      <h3>{copy.titles[phase]}</h3>
      <fieldset disabled={pending}>
        {phase === "verify" || phase === "password" ? null : (
          <label htmlFor={id + "-email"}>
            {copy.email}
            <input
              id={id + "-email"}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFailure(null);
              }}
            />
          </label>
        )}
        {passwordPhase ? (
          <div className="app-email-auth__field">
            <label htmlFor={id + "-password"}>
              {phase === "password" ? copy.newPassword : copy.password}
            </label>
            <span className="app-email-auth__password">
              <input
                id={id + "-password"}
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={
                  phase === "login" ? "current-password" : "new-password"
                }
                minLength={phase === "login" ? undefined : minPasswordLength}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? copy.hidePassword : copy.showPassword}
              </button>
            </span>
          </div>
        ) : null}
        {phase === "signup" && terms ? (
          <label className="app-email-auth__terms">
            <input
              type="checkbox"
              required
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>{terms}</span>
          </label>
        ) : null}
        {phase === "verify" ? (
          <>
            <p>{copy.codeSent(email)}</p>
            <label htmlFor={id + "-code"}>
              {copy.code}
              <input
                id={id + "-code"}
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setFailure(null);
                }}
              />
            </label>
          </>
        ) : null}
        {failure ? <p role="alert">{failure.message}</p> : null}
        {failure?.reason === "verification-needed" ? (
          <button type="button" onClick={() => void requestCode("signup")}>
            {copy.sendCode}
          </button>
        ) : null}
        <button className="app-email-auth__primary" type="submit">
          {phase === "login"
            ? copy.login
            : phase === "forgot"
              ? copy.sendCode
              : phase === "password"
                ? copy.savePassword
                : copy.continue}
        </button>
        <div className="app-email-auth__links">
          {phase === "login" ? (
            <>
              <button type="button" onClick={() => move("forgot")}>
                {copy.forgot}
              </button>
              <button type="button" onClick={() => move("signup")}>
                {copy.signup}
              </button>
            </>
          ) : phase === "signup" || phase === "forgot" ? (
            <button type="button" onClick={() => move("login")}>
              {copy.login}
            </button>
          ) : phase === "verify" ? (
            <>
              <button type="button" onClick={() => void requestCode(purpose)}>
                {copy.resend}
              </button>
              <button
                type="button"
                onClick={() => move(purpose === "reset" ? "forgot" : "signup")}
              >
                {copy.changeEmail}
              </button>
            </>
          ) : null}
        </div>
      </fieldset>
      {pending ? <p role="status">{copy.pending}</p> : null}
    </form>
  );
}
