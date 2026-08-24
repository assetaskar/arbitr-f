// REST-часть API. Настройки на сервере не хранятся — он отдаёт только дефолты,
// живые данные приходят по WebSocket (см. useLiveData.ts).
import type { CandlesResponse, ChartLeg, ExchangeInfo, Settings } from './types'

const SETTINGS_KEY = 'arbitr.settings'

export async function fetchExchanges(): Promise<ExchangeInfo[]> {
  const r = await fetch('/api/exchanges')
  if (!r.ok) throw new Error('Не удалось загрузить список бирж')
  return r.json()
}

export async function fetchDefaultSettings(): Promise<Settings> {
  const r = await fetch('/api/settings')
  if (!r.ok) throw new Error('Не удалось загрузить настройки по умолчанию')
  return r.json()
}

// Свечи одной ноги графика. Бэкенд всегда отвечает 200: отказ биржи приезжает
// строкой в поле error, чтобы вторая нога всё равно нарисовалась.
export async function fetchCandles(
  leg: ChartLeg,
  symbol: string,
  timeframe: string,
  limit = 300,
): Promise<CandlesResponse> {
  const q = new URLSearchParams({
    exchange: leg.exchange,
    market: leg.market,
    symbol,
    timeframe,
    limit: String(limit),
  })
  const r = await fetch(`/api/candles?${q}`)
  if (!r.ok) throw new Error('Не удалось загрузить свечи')
  return r.json()
}

// Настройки принадлежат этому браузеру: у другой вкладки/устройства они свои.
export function loadStoredSettings(): Partial<Settings> | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? (JSON.parse(raw) as Partial<Settings>) : null
  } catch {
    return null
  }
}

export function storeSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* приватный режим / переполнение — не критично */
  }
}

// URL WebSocket с учётом текущего хоста и протокола (ws/wss).
export function wsUrl(): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/ws`
}
