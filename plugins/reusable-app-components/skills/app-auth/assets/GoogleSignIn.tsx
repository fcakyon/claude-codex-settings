"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import "./google-sign-in.css";

export interface GoogleIdentity {
  initialize(options: {
    client_id: string;
    callback: (response: { credential: string }) => void;
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
  }): void;
}

type Props<User> = {
  identity: GoogleIdentity | null;
  clientId: string;
  nonce?: string;
  locale: string;
  redirectEndpoint: string;
  returnTo: string;
  theme?: "outline" | "filled_black" | "filled_blue";
  initialError?: string;
  copy: { fallback: string; pending: string };
  onCredential: (credential: string, signal: AbortSignal) => Promise<User>;
  onAuthenticated: (user: User) => void;
  onFailure: (error: unknown) => string;
};

export function GoogleSignIn<User>({
  identity, clientId, nonce, locale, redirectEndpoint, returnTo,
  theme = "outline", initialError = "", copy, onCredential,
  onAuthenticated, onFailure,
}: Props<User>) {
  const button = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError);
  const params = new URLSearchParams({ returnTo, prompt: "select_account" });

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
      use_fedcm_for_button: true,
      button_auto_select: false,
    });
    identity.renderButton(parent, {
      theme, size: "large", text: "continue_with", shape: "rectangular",
      locale,
    });
    return () => { operation.abort(); parent.replaceChildren(); };
  }, [identity, clientId, nonce, locale, theme]);

  return (
    <div className="app-google-sign-in" aria-busy={pending}>
      <div ref={button} inert={pending} aria-hidden={pending} className="app-google-sign-in__button" />
      {pending ? <p role="status">{copy.pending}</p> : <a href={`${redirectEndpoint}?${params}`}>{copy.fallback}</a>}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
