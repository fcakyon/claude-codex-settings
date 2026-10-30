"use client";

import { useEffect, useEffectEvent, useRef } from "react";

export type SupportIdentity = { userId: string; hash: string } & Record<string, string>;
type Callback = (error?: unknown) => void;
export type TawkApi = {
  onChatMaximized?: () => void;
  login: (identity: SupportIdentity, callback: Callback) => void;
  logout: (callback: Callback) => void;
  minimize: () => void;
  hideWidget: () => void;
  showWidget: () => void;
};

const call = (run: (done: Callback) => void) => new Promise<void>((resolve, reject) => run(error => error ? reject(error) : resolve()));

export function TawkSupport({ api, accountKey, attributes, hidden = false, resolveIdentity, onFailure }: {
  api: TawkApi | null;
  accountKey: string | null;
  attributes: Record<string, string>;
  hidden?: boolean;
  resolveIdentity: (signal: AbortSignal) => Promise<SupportIdentity>;
  onFailure: (error: unknown) => void;
}) {
  const synchronize = useRef<() => void>(() => {});
  const attributeKey = JSON.stringify(attributes);
  const identity = useEffectEvent(resolveIdentity);
  const context = useEffectEvent(() => attributes);
  const report = useEffectEvent(onFailure);

  useEffect(() => {
    if (!api) return;
    let account: string | undefined;
    let queue = Promise.resolve();
    let request: AbortController | undefined;
    const sync = () => {
      request?.abort();
      const operation = new AbortController();
      request = operation;
      queue = queue.then(async () => {
        if (operation.signal.aborted) return;
        const verified = await identity(operation.signal);
        if (operation.signal.aborted) return;
        // Secure Mode rejects unsigned writes, so guests log in under a signed visitor ID and a repeat login updates attributes.
        if (account && account !== verified.userId) await call(done => api.logout(done));
        if (!operation.signal.aborted) await call(done => api.login({ ...context(), ...verified }, done));
        account = verified.userId;
      }).catch(error => { if (!operation.signal.aborted) report(error); });
    };
    synchronize.current = sync;
    const previous = api.onChatMaximized;
    api.onChatMaximized = () => { previous?.(); sync(); };
    window.addEventListener("focus", sync);
    return () => {
      request?.abort();
      synchronize.current = () => {};
      api.onChatMaximized = previous;
      window.removeEventListener("focus", sync);
    };
  }, [api]);

  useEffect(() => { synchronize.current(); }, [api, accountKey, attributeKey]);
  useEffect(() => {
    if (!api) return;
    if (hidden) { api.minimize(); api.hideWidget(); }
    else api.showWidget();
  }, [api, hidden]);

  return null;
}
