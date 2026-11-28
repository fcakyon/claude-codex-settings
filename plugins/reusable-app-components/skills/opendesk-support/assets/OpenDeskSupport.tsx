"use client";

import { useEffect, useRef } from "react";
import { supportWidget } from "./support-widget";

export function OpenDeskSupport({
  url,
  widgetKey,
  identityUrl,
  accountKey,
  language,
  hidden = false,
}: {
  url: string;
  widgetKey: string;
  identityUrl: string;
  accountKey: string | null;
  language: string;
  hidden?: boolean;
}) {
  const context = useRef({ accountKey, language, hidden, identityUrl });
  const prevAccountKey = useRef(accountKey);
  const chat = useRef<ReturnType<typeof supportWidget> | null>(null);
  useEffect(() => {
    context.current = { accountKey, language, hidden, identityUrl };
    if (prevAccountKey.current !== accountKey) {
      prevAccountKey.current = accountKey;
      chat.current?.sync(true);
    } else {
      chat.current?.visibility();
    }
  }, [accountKey, language, hidden, identityUrl]);
  useEffect(() => {
    prevAccountKey.current = context.current.accountKey;
    chat.current = supportWidget({
      key: widgetKey,
      url,
      identityUrl: () => context.current.identityUrl,
      context: () => context.current,
    });
    return () => {
      chat.current?.destroy();
      chat.current = null;
    };
  }, [url, widgetKey]);
  return null;
}
