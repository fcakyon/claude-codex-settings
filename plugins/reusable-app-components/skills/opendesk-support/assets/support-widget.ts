type WidgetApi = ((command: string, ...args: unknown[]) => void) & { q?: unknown[][] }
declare global { interface Window { opendesk?: WidgetApi } }

let operations = Promise.resolve()

export function supportWidget({ key, url, identityUrl, context }: { key: string, url: string, identityUrl: () => string, context: () => { language: string, hidden: boolean } }) {
  let request: AbortController | undefined
  let script: HTMLScriptElement | undefined
  let identity: string | undefined
  let stopped = false

  const visibility = () => {
    const host = document.querySelector<HTMLElement>('[data-opendesk-widget]')
    if (context().hidden) window.opendesk?.('close')
    if (host) host.style.display = context().hidden ? 'none' : ''
    window.opendesk?.('locale', context().language)
  }
  const clear = () => {
    window.opendesk?.('shutdown')
    script?.remove()
    script = undefined
    identity = undefined
  }
  const sync = (reset = false) => {
    request?.abort()
    const controller = new AbortController()
    request = controller
    if (reset) {
      window.opendesk?.('close')
      const host = document.querySelector<HTMLElement>('[data-opendesk-widget]')
      if (host) host.style.display = 'none'
    }
    operations = operations.then(async () => {
      if (stopped || controller.signal.aborted) return
      if (reset) clear()
      const response = await fetch(identityUrl(), { cache: 'no-store', signal: controller.signal })
      if (!response.ok) throw Error('Support identity request failed')
      const account = response.status === 204 ? {} : await response.json()
      if (stopped || controller.signal.aborted) return
      const next = JSON.stringify(account)
      if (identity !== next) {
        clear()
        const queue: unknown[][] = []
        window.opendesk = Object.assign((...args: unknown[]) => { queue.push(args) }, { q: queue })
        window.opendesk('identify', account)
        window.opendesk('locale', context().language)
        const element = document.createElement('script')
        script = element
        element.src = `${url}/widget/v1.js`
        element.dataset.key = key
        element.dataset.lang = context().language
        element.async = true
        await new Promise<void>((resolve, reject) => {
          element.onload = () => resolve()
          element.onerror = () => reject(Error('Support widget could not load'))
          document.body.append(element)
        })
        identity = next
        window.opendesk?.('on', 'open', () => sync())
      }
      visibility()
    }).catch(() => {
      if (!stopped && !controller.signal.aborted) console.error('Support chat could not connect.')
    })
  }
  const focus = () => sync()
  window.addEventListener('focus', focus)
  sync()
  return {
    sync,
    visibility,
    destroy() {
      stopped = true
      request?.abort()
      window.removeEventListener('focus', focus)
      operations = operations.then(clear)
    }
  }
}
