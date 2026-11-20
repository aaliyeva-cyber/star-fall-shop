// Kit file — replaced on every kit update; write your settings in src/variants.json instead.
//
// The prototype's settings: variants of a screen, ideas being tested, the conditions a
// scenario runs in. They are declared in src/variants.json and live in the address, so a
// link shows exactly what its author saw and the Context button can switch them:
//
//   #checkout?state=error&layout=grid&auth=1&ui=0
//    screen    state       settings          a test link: no Context button
//
// A setting the address leaves out has its default. In a screen:
//
//   const layout = useSetting('layout')          // 'list' | 'grid' …
//   {layout === 'grid' ? <Grid /> : <List />}
//
// To another screen, keeping the settings:   go('success')   or   go('checkout', 'error')
import { useEffect, useState } from 'react'

type Axis = {
  /** The address parameter; the setting's id when unset. */
  param?: string
  options: Record<string, string>
  default: string
  /** What goes into the address for an option, when it is not the option id itself. */
  values?: Record<string, string>
  /** `many` — any set of the options, as a comma list; `text` — free text. */
  kind?: 'one' | 'many' | 'text'
}

// The declarations, if the project has any yet (a glob, so a missing file is no error).
const files = import.meta.glob('../variants.json', { eager: true, import: 'default' }) as Record<string, { axes?: Record<string, Axis> }>
const AXES: Record<string, Axis> = Object.values(files)[0]?.axes ?? {}

const paramOf = (id: string) => AXES[id]?.param ?? id

/** `#checkout?state=error&layout=grid` → its parts. */
export function readAddress(hash: string = location.hash) {
  const raw = hash.replace(/^#/, '')
  const at = raw.indexOf('?')
  const screen = at < 0 ? raw : raw.slice(0, at)
  const query = new URLSearchParams(at < 0 ? '' : raw.slice(at + 1))
  return { screen, state: query.get('state'), query, test: query.get('ui') === '0' }
}

/** A setting's value as the address has it: the option, or the default when it is not there. */
export function settingIn(query: URLSearchParams, id: string): string {
  const axis = AXES[id]
  if (!axis) return ''
  const raw = query.get(paramOf(id))
  if (raw === null) return axis.default
  if (axis.kind === 'many' || axis.kind === 'text') return raw
  const byValue = Object.entries(axis.values ?? {}).find(([, v]) => v === raw)?.[0]
  const option = byValue ?? raw
  return option in axis.options ? option : axis.default
}

/** The current value of a setting; the screen redraws when it changes. */
export function useSetting(id: string): string {
  const [value, setValue] = useState(() => settingIn(readAddress().query, id))
  useEffect(() => {
    const sync = () => setValue(settingIn(readAddress().query, id))
    addEventListener('hashchange', sync)
    return () => removeEventListener('hashchange', sync)
  }, [id])
  return value
}

/** Every declared setting with its current value. */
export function useSettings(): Record<string, string> {
  const read = () => Object.fromEntries(Object.keys(AXES).map((id) => [id, settingIn(readAddress().query, id)]))
  const [all, setAll] = useState(read)
  useEffect(() => {
    const sync = () => setAll(read())
    addEventListener('hashchange', sync)
    return () => removeEventListener('hashchange', sync)
  }, [])
  return all
}

const readable = (q: URLSearchParams) => q.toString().replace(/%2C/gi, ',').replace(/%3A/gi, ':')

/**
 * To another screen (and state), keeping the settings and a test link's `ui=0`: moving on is
 * not resetting what the designer picked. A plain `location.hash = '#…'` would drop them.
 */
export function go(screen: string, state?: string | null): void {
  const { query } = readAddress()
  const next = new URLSearchParams()
  if (state) next.set('state', state)
  const own = new Set([...Object.keys(AXES).map(paramOf), 'ui'])
  query.forEach((v, k) => {
    if (own.has(k)) next.set(k, v)
  })
  const qs = readable(next)
  location.hash = '#' + screen + (qs ? '?' + qs : '')
}

/** Set a setting from the screen itself (a toggle inside the prototype). Not a step for Back. */
export function setSetting(id: string, option: string): void {
  const axis = AXES[id]
  if (!axis) return
  const { screen, query } = readAddress()
  const value = axis.values?.[option] ?? option
  if (option === axis.default) query.delete(paramOf(id))
  else query.set(paramOf(id), value)
  const qs = readable(query)
  history.replaceState(history.state, '', location.pathname + location.search + '#' + screen + (qs ? '?' + qs : ''))
  dispatchEvent(new HashChangeEvent('hashchange'))
}
