"use client"

import { useEffect, useRef } from "react"
import { supportWidget } from "./support-widget"

export function OpenDeskSupport({ url, widgetKey, identityUrl, accountKey, language, hidden = false }: {
  url: string
  widgetKey: string
  identityUrl: string
  accountKey: string | null
  language: string
  hidden?: boolean
}) {
  const context = useRef({ language, hidden, identityUrl })
  const chat = useRef<ReturnType<typeof supportWidget> | null>(null)
  useEffect(() => {
    context.current = { language, hidden, identityUrl }
    chat.current?.visibility()
  }, [language, hidden, identityUrl])
  useEffect(() => {
    chat.current = supportWidget({ key: widgetKey, url, identityUrl: () => context.current.identityUrl, context: () => context.current })
    return () => { chat.current?.destroy() }
  }, [url, widgetKey])
  useEffect(() => { chat.current?.sync(true) }, [accountKey])
  return null
}
