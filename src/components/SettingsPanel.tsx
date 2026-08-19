import { useEffect, useState } from 'react'
import type { ExchangeInfo, PairMode, Settings } from '../types'

interface Props {
  settings: Settings
  exchanges: ExchangeInfo[]
  universeSize: number
  onSave: (s: Settings) => void
}

const QUOTES = ['USDT', 'USDC', 'BTC', 'ETH']

// Разбираем строку с парами/базами: разделители — запятая, пробел, перевод строки.
function parseList(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    ),
  )
}

export function SettingsPanel({ settings, exchanges, universeSize, onSave }: Props) {
  const [draft, setDraft] = useState<Settings>(settings)
  const [symbolsText, setSymbolsText] = useState(settings.symbols.join(', '))
  const [excludeText, setExcludeText] = useState(settings.exclude_symbols.join(', '))

  // Синхронизируемся, если настройки пришли/поменялись извне.
  useEffect(() => {
    setDraft(settings)
    setSymbolsText(settings.symbols.join(', '))
    setExcludeText(settings.exclude_symbols.join(', '))
  }, [settings])

  const toggleExchange = (id: string) => {
    setDraft((d) => ({
      ...d,
      exchanges: d.exchanges.includes(id)
        ? d.exchanges.filter((e) => e !== id)
        : [...d.exchanges, id],
    }))
  }

  const toggleQuote = (q: string) => {
    setDraft((d) => ({
      ...d,
      quote_currencies: d.quote_currencies.includes(q)
        ? d.quote_currencies.filter((x) => x !== q)
        : [...d.quote_currencies, q],
    }))
  }

  const setMode = (mode: PairMode) => setDraft((d) => ({ ...d, pair_mode: mode }))

  // Итоговый объект настроек с учётом текстовых полей.
  const compiled: Settings = {
    ...draft,
    symbols: parseList(symbolsText),
    exclude_symbols: parseList(excludeText),
  }

  const submit = () => onSave(compiled)
  const dirty = JSON.stringify(compiled) !== JSON.stringify(settings)
  const isAll = draft.pair_mode === 'all'

  return (
    <div className="panel__body">
      <div className="field">
        <label className="field__label">Биржи для сканирования</label>
        <div className="ex-grid">
          {exchanges.map((ex) => {
            const active = draft.exchanges.includes(ex.id)
            return (
              <button
                key={ex.id}
                type="button"
                className={`ex-chip ${active ? 'ex-chip--on' : ''}`}
                onClick={() => toggleExchange(ex.id)}
              >
                <span className="ex-chip__name">{ex.name}</span>
                <span className="ex-chip__tags">
                  {ex.has_funding ? 'спот+фьюч' : 'только спот'}
                </span>
              </button>
            )
          })}
          {exchanges.length === 0 && <span className="muted">загрузка бирж…</span>}
        </div>
        <p className="field__hint">Выбрано: {draft.exchanges.length}</p>
      </div>

      {/* Режим выбора пар */}
      <div className="field">
        <label className="field__label">Пары</label>
        <div className="seg">
          <button
            type="button"
            className={`seg__btn ${isAll ? 'seg__btn--on' : ''}`}
            onClick={() => setMode('all')}
          >
            Все пары
          </button>
          <button
            type="button"
            className={`seg__btn ${!isAll ? 'seg__btn--on' : ''}`}
            onClick={() => setMode('include')}
          >
            Список пар
          </button>
        </div>
      </div>

      {isAll ? (
        <>
          <div className="field">
            <label className="field__label">Котировки</label>
            <div className="quote-row">
              {QUOTES.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={`q-chip ${draft.quote_currencies.includes(q) ? 'q-chip--on' : ''}`}
                  onClick={() => toggleQuote(q)}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="field__hint">
              Сканируются все пары этих котировок, что есть минимум на 2 биржах.
              {universeSize > 0 && (
                <>
                  {' '}Сейчас: <b>{universeSize}</b> пар.
                </>
              )}
            </p>
          </div>

          <div className="field">
            <label className="field__label">Исключить пары / монеты</label>
            <textarea
              className="input input--area"
              rows={2}
              value={excludeText}
              onChange={(e) => setExcludeText(e.target.value)}
              placeholder="LUNA, USTC, BTC/USDT"
            />
            <p className="field__hint">Полный символ (BTC/USDT) или база (LUNA — все пары LUNA).</p>
          </div>

          <div className="field">
            <label className="field__label">Мин. объём, $/сут</label>
            <input
              className="input input--num"
              type="number"
              step="10000"
              min="0"
              value={draft.min_volume_usd}
              onChange={(e) =>
                setDraft((d) => ({ ...d, min_volume_usd: Number(e.target.value) }))
              }
            />
            <p className="field__hint">
              Отсекает неликвид. Пара участвует, если проходит по объёму минимум на 2 биржах.
            </p>
          </div>
        </>
      ) : (
        <div className="field">
          <label className="field__label">Торговые пары</label>
          <textarea
            className="input input--area"
            rows={3}
            value={symbolsText}
            onChange={(e) => setSymbolsText(e.target.value)}
            placeholder="BTC/USDT, ETH/USDT, SOL/USDT"
          />
          <p className="field__hint">Формат ccxt: BASE/QUOTE. Разделители — запятая или пробел.</p>
        </div>
      )}

      <div className="field field--row">
        <div>
          <label className="field__label">Мин. спред, %</label>
          <input
            className="input input--num"
            type="number"
            step="0.05"
            min="0"
            value={draft.min_spread_pct}
            onChange={(e) =>
              setDraft((d) => ({ ...d, min_spread_pct: Number(e.target.value) }))
            }
          />
        </div>
        <div>
          <label className="field__label">Интервал, сек</label>
          <input
            className="input input--num"
            type="number"
            step="1"
            min="5"
            max="600"
            value={draft.refresh_interval_sec}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                refresh_interval_sec: Number(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <div className="field">
        <label className="field__label">Что искать</label>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.track_spot}
            onChange={(e) => setDraft((d) => ({ ...d, track_spot: e.target.checked }))}
          />
          Межбиржевой спот
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.track_perp}
            onChange={(e) => setDraft((d) => ({ ...d, track_perp: e.target.checked }))}
          />
          Межбиржевой фьючерс
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.track_basis}
            onChange={(e) => setDraft((d) => ({ ...d, track_basis: e.target.checked }))}
          />
          Базис спот↔фьючерс (внутри биржи)
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.track_funding}
            onChange={(e) =>
              setDraft((d) => ({ ...d, track_funding: e.target.checked }))
            }
          />
          Funding (бессрочные фьючерсы)
        </label>
      </div>

      <button
        className="btn btn--primary btn--wide"
        onClick={submit}
        disabled={
          !dirty || draft.exchanges.length < 2 || (isAll && draft.quote_currencies.length === 0)
        }
      >
        {dirty ? 'Применить' : 'Сохранено'}
      </button>
      {draft.exchanges.length < 2 && (
        <p className="field__hint field__hint--warn">Нужно минимум 2 биржи.</p>
      )}
      {isAll && draft.quote_currencies.length === 0 && (
        <p className="field__hint field__hint--warn">Выберите хотя бы одну котировку.</p>
      )}
    </div>
  )
}
