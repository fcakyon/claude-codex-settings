"use client";

import { useEffect, useEffectEvent, useRef } from "react";

export type SupportIdentity = {
  userId: string;
  hash: string;
  name: string;
  email: string;
} & Record<string, string>;
type Callback = (error?: unknown) => void;
export type TawkApi = {
  onChatMaximized?: () => void;
  login: (identity: SupportIdentity, callback: Callback) => void;
  logout: (callback: Callback) => void;
  setAttributes: (attributes: Record<string, string>, callback: Callback) => void;
  minimize: () => void;
  hideWidget: () => void;
  showWidget: () => void;
};

export function TawkSupport({ api, accountKey, attributes, hidden = false, resolveIdentity, onFailure }: {
  api: TawkApi | null;
  accountKey: string | null;
  attributes: Record<string, string>;
  hidden?: boolean;
  resolveIdentity: (signal: AbortSignal) => Promise<SupportIdentity | null>;
  onFailure: (error: unknown) => void;
}) {
  const synchronize = useRef<() => void>(() => {});
  const attributeKey = JSON.stringify(attributes);
  const identity = useEffectEvent(resolveIdentity);
  const context = useEffectEvent(() => attributes);
  const report = useEffectEvent(onFailure);

  useEffect(() => {
    if (!api) return;
    let account: string | null | undefined = null;
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
        const custom = context();
        if (account !== verified?.userId) {
          await new Promise<void>((resolve, reject) => {
            const done: Callback = error => error ? reject(error) : resolve();
            if (verified) api.login({ ...custom, ...verified }, done);
            else api.logout(done);
          });
          account = verified?.userId;
          if (verified) return;
        }
        if (!operation.signal.aborted) {
          await new Promise<void>((resolve, reject) => api.setAttributes(custom, error => error ? reject(error) : resolve()));
        }
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
