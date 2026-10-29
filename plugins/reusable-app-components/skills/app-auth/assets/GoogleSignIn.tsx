"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import "./google-sign-in.css";

export interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    login_hint?: string;
    nonce?: string;
    use_fedcm_for_button: boolean;
    button_auto_select: boolean;
  }): void;
  renderButton(element: HTMLElement, options: {
    theme: "outline" | "filled_black" | "filled_blue";
    size: "large";
    text: "continue_with";
    shape: "rectangular";
    locale: string;
    width: number;
  }): void;
}

type Props<User> = {
  identity: GoogleIdentity | null;
  clientId: string;
  nonce?: string;
  locale: string;
  accountHint: string;
  redirectEndpoint: string;
  returnTo: string;
  theme?: "outline" | "filled_black" | "filled_blue";
  initialError?: string;
  copy: { fallback: string; anotherAccount: string; pending: string };
  onCredential: (credential: string, signal: AbortSignal) => Promise<User>;
  onAuthenticated: (user: User) => void;
  onFailure: (error: unknown) => string;
  onUseAnotherAccount: () => void;
};

export function GoogleSignIn<User>({
  identity, clientId, nonce, locale, accountHint, redirectEndpoint, returnTo,
  theme = "outline", initialError = "", copy, onCredential,
  onAuthenticated, onFailure, onUseAnotherAccount,
}: Props<User>) {
  const button = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError);
  const params = new URLSearchParams({ returnTo });
  if (accountHint) params.set("login_hint", accountHint);
  else params.set("prompt", "select_account");

  const acceptCredential = useEffectEvent(async (credential: string, signal: AbortSignal) => {
    if (signal.aborted) return;
    setPending(true);
    setError("");
    let user: User;
    try {
      user = await onCredential(credential, signal);
    } catch (failure) {
      if (signal.aborted) return;
      setError(onFailure(failure));
      setPending(false);
      return;
    }
    if (signal.aborted) return;
    setPending(false);
    onAuthenticated(user);
  });

  useEffect(() => {
    setPending(false);
    if (!identity) return;
    const operation = new AbortController();
    const parent = button.current!;
    identity.initialize({
      client_id: clientId,
      nonce,
      callback: ({ credential }) => { void acceptCredential(credential, operation.signal); },
      login_hint: accountHint || undefined,
      use_fedcm_for_button: true,
      button_auto_select: Boolean(accountHint),
    });
    const resize = new ResizeObserver(() => {
      parent.replaceChildren();
      identity.renderButton(parent, {
        theme, size: "large", text: "continue_with", shape: "rectangular",
        locale, width: Math.min(parent.clientWidth, 400),
      });
    });
    resize.observe(parent);
    return () => { operation.abort(); resize.disconnect(); parent.replaceChildren(); };
  }, [identity, clientId, nonce, accountHint, locale, theme]);

  return (
    <div className="app-google-sign-in" aria-busy={pending}>
      <div ref={button} inert={pending} aria-hidden={pending} className="app-google-sign-in__button" />
      {pending ? <p role="status">{copy.pending}</p> : <>
        <a href={`${redirectEndpoint}?${params}`}>{copy.fallback}</a>
        {accountHint ? <button type="button" onClick={onUseAnotherAccount}>{copy.anotherAccount}</button> : null}
      </>}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
