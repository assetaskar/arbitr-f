// Типы, зеркалящие pydantic-модели бэкенда (app/models.py).

export type PairMode = 'all' | 'include'

export interface Settings {
  exchanges: string[]
  pair_mode: PairMode
  symbols: string[]
  quote_currencies: string[]
  exclude_symbols: string[]
  min_volume_usd: number
  top_n: number
  min_spread_pct: number
  refresh_interval_sec: number
  track_spot: boolean
  track_perp: boolean
  track_basis: boolean
  track_funding: boolean
}

// Общая форма межбиржевого расхождения (используется и для спота, и для фьючерса).
export interface CrossOpportunity {
  symbol: string
  buy_exchange: string
  buy_price: number
  sell_exchange: string
  sell_price: number
  spread_pct: number
}

export type SpotOpportunity = CrossOpportunity
export type PerpOpportunity = CrossOpportunity

export interface BasisOpportunity {
  symbol: string
  exchange: string
  spot_price: number
  perp_price: number
  basis_pct: number
  direction: 'perp_premium' | 'perp_discount'
}

export interface FundingLeg {
  exchange: string
  funding_rate: number
  funding_apr: number
  mark_price: number | null
  next_funding_time: number | null
}

export interface FundingOpportunity {
  symbol: string
  long_exchange: string
  long_rate: number
  short_exchange: string
  short_rate: number
  spread_pct: number
  spread_apr: number
  legs: FundingLeg[]
}

export interface Snapshot {
  updated_at: number
  scanning: boolean
  universe_size: number
  data_age_sec: number
  spot: SpotOpportunity[]
  perp: PerpOpportunity[]
  basis: BasisOpportunity[]
  funding: FundingOpportunity[]
  errors: Record<string, string>
}

export interface ExchangeInfo {
  id: string
  name: string
  has_spot: boolean
  has_perp: boolean
  has_funding: boolean
}
