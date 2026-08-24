// График двух ног строки: цены обеих бирж наложены, снизу — расхождение между ними.
import { useEffect, useRef, useState } from 'react'
import {
  CandlestickSeries,
  createChart,
  LineSeries,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type UTCTimestamp,
} from 'lightweight-charts'
import { fetchCandles } from '../api'
import type { Candle, ChartLeg, ChartTarget } from '../types'
import { fmtPct } from '../format'

const TIMEFRAMES = ['5m', '15m', '1h', '4h', '1d']
const LIMIT = 300

// Доли высоты: цены сверху, спред отдельной полосой снизу. Значения подобраны так,
// чтобы полосы гарантированно не пересекались при любых данных.
const PRICE_MARGINS = { top: 0.06, bottom: 0.32 }
const SPREAD_MARGINS = { top: 0.78, bottom: 0.02 }

type ChartMode = 'lines' | 'candles'
type LegKey = 'a' | 'b'

// Тема живёт в CSS-переменных, а библиотеке нужны реальные значения цветов.
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// ccxt отдаёт миллисекунды, lightweight-charts ждёт секунды.
function toLine(candles: Candle[]): LineData[] {
  return candles.map((c) => ({ time: (c[0] / 1000) as UTCTimestamp, value: c[4] }))
}

function toOhlc(candles: Candle[]): CandlestickData[] {
  return candles.map((c) => ({
    time: (c[0] / 1000) as UTCTimestamp,
    open: c[1],
    high: c[2],
    low: c[3],
    close: c[4],
  }))
}

// Расхождение считается только на общих метках времени: свеча, которой нет у
// соседа, свою линию цены сохраняет, но в спред не попадает.
function spreadLine(a: Candle[], b: Candle[]): LineData[] {
  const closeAt = new Map(a.map((c) => [c[0], c[4]]))
  const out: LineData[] = []
  for (const c of b) {
    const base = closeAt.get(c[0])
    if (!base) continue
    out.push({ time: (c[0] / 1000) as UTCTimestamp, value: ((c[4] - base) / base) * 100 })
  }
  return out
}

interface Props {
  target: ChartTarget
  names: Record<string, string>
}

interface Loaded {
  a: Candle[]
  b: Candle[]
}

export function PriceChart({ target, names }: Props) {
  const [timeframe, setTimeframe] = useState('1h')
  const [mode, setMode] = useState<ChartMode>('lines')
  // Свечи рисуются только для одной ноги: два набора тел перекрыли бы друг друга.
  const [candleLeg, setCandleLeg] = useState<LegKey>('a')
  const [data, setData] = useState<Loaded | null>(null)
  const [notes, setNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const boxRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<{
    a: ISeriesApi<'Line'>
    b: ISeriesApi<'Line'>
    candles: ISeriesApi<'Candlestick'>
    spread: ISeriesApi<'Line'>
  } | null>(null)

  const legOf = (key: LegKey): ChartLeg => (key === 'a' ? target.a : target.b)
  const legName = (leg: ChartLeg) =>
    `${names[leg.exchange] ?? leg.exchange} · ${leg.market === 'spot' ? 'спот' : 'фьюч'}`

  // Загрузка обеих ног. Отказ одной биржи не мешает нарисовать вторую.
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      fetchCandles(target.a, target.symbol, timeframe, LIMIT),
      fetchCandles(target.b, target.symbol, timeframe, LIMIT),
    ])
      .then(([ra, rb]) => {
        if (cancelled) return
        const msgs: string[] = []
        if (ra.error) msgs.push(`${legName(target.a)} — ${ra.error}`)
        if (rb.error) msgs.push(`${legName(target.b)} — ${rb.error}`)
        setNotes(msgs)
        setData({ a: ra.candles, b: rb.candles })
      })
      .catch((e) => {
        if (cancelled) return
        setNotes([String(e.message ?? e)])
        setData(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [target, timeframe])

  // График создаётся один раз на всё время жизни модалки.
  useEffect(() => {
    const box = boxRef.current
    if (!box) return

    const chart = createChart(box, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: cssVar('--text-dim'),
        fontFamily: cssVar('--mono'),
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: cssVar('--border') },
        horzLines: { color: cssVar('--border') },
      },
      // Цены — на правой оси, расхождение — на левой. Разделение задано полями шкал,
      // а не второй панелью: поля жёстко фиксируют полосы независимо от данных,
      // тогда как у панели высота зависит от растяжения и порядка инициализации.
      rightPriceScale: {
        visible: true,
        borderColor: cssVar('--border'),
        scaleMargins: PRICE_MARGINS,
      },
      leftPriceScale: {
        visible: true,
        borderColor: cssVar('--border'),
        scaleMargins: SPREAD_MARGINS,
      },
      timeScale: { borderColor: cssVar('--border'), timeVisible: true },
      crosshair: { mode: 0 },
    })

    const green = cssVar('--green')
    const red = cssVar('--red')

    const a = chart.addSeries(LineSeries, {
      color: cssVar('--accent'),
      lineWidth: 2,
      priceScaleId: 'right',
    })
    const b = chart.addSeries(LineSeries, {
      color: cssVar('--amber'),
      lineWidth: 2,
      priceScaleId: 'right',
    })
    const candles = chart.addSeries(CandlestickSeries, {
      priceScaleId: 'right',
      upColor: green,
      downColor: red,
      borderUpColor: green,
      borderDownColor: red,
      wickUpColor: green,
      wickDownColor: red,
      visible: false,
    })
    // Спред нейтрального цвета: зелёный и красный заняты телами свечей, синий и
    // янтарный — ногами. --text-dim не годится, он совпадает с подписями осей.
    const spread = chart.addSeries(LineSeries, {
      color: cssVar('--text'),
      lineWidth: 1,
      priceScaleId: 'left',
      priceFormat: { type: 'percent' },
    })

    chartRef.current = chart
    seriesRef.current = { a, b, candles, spread }

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // Данные заливаются отдельно: пересоздавать график при смене режима незачем.
  useEffect(() => {
    const s = seriesRef.current
    if (!s || !data) return

    const candled = mode === 'candles' ? (candleLeg === 'a' ? data.a : data.b) : []
    s.candles.setData(toOhlc(candled))
    s.a.setData(toLine(data.a))
    s.b.setData(toLine(data.b))
    s.spread.setData(spreadLine(data.a, data.b))

    // Нога, ставшая свечами, линией больше не дублируется; вторая остаётся линией,
    // иначе сравнивать будет не с чем.
    s.candles.applyOptions({ visible: mode === 'candles' })
    s.a.applyOptions({ visible: !(mode === 'candles' && candleLeg === 'a') })
    s.b.applyOptions({ visible: !(mode === 'candles' && candleLeg === 'b') })

    chartRef.current?.timeScale().fitContent()
  }, [data, mode, candleLeg])

  // Последнее расхождение — для подписи над графиком.
  const lastSpread = (() => {
    if (!data) return null
    const line = spreadLine(data.a, data.b)
    return line.length ? (line[line.length - 1].value as number) : null
  })()

  return (
    <div className="chart">
      <div className="chart__bar">
        <div className="chart__legend">
          {(['a', 'b'] as LegKey[]).map((key) => (
            <span className="chart__leg" key={key}>
              <i
                className="chart__dot"
                style={{ background: key === 'a' ? 'var(--accent)' : 'var(--amber)' }}
              />
              {legName(legOf(key))}
              {mode === 'candles' && candleLeg === key && (
                <span className="chart__leg--note">свечи</span>
              )}
            </span>
          ))}
          {lastSpread !== null && (
            <span className="chart__leg chart__leg--spread">
              расхождение сейчас: <b className="mono">{fmtPct(lastSpread)}</b>
            </span>
          )}
        </div>

        <div className="chart__controls">
          <div className="seg">
            <button
              type="button"
              className={`seg__btn ${mode === 'lines' ? 'seg__btn--on' : ''}`}
              onClick={() => setMode('lines')}
            >
              линии
            </button>
            <button
              type="button"
              className={`seg__btn ${mode === 'candles' ? 'seg__btn--on' : ''}`}
              onClick={() => setMode('candles')}
            >
              свечи
            </button>
          </div>

          {mode === 'candles' && (
            <div className="seg" title="Чью цену показывать свечами">
              {(['a', 'b'] as LegKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`seg__btn ${candleLeg === key ? 'seg__btn--on' : ''}`}
                  onClick={() => setCandleLeg(key)}
                >
                  {names[legOf(key).exchange] ?? legOf(key).exchange}
                </button>
              ))}
            </div>
          )}

          <div className="seg">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                className={`seg__btn ${tf === timeframe ? 'seg__btn--on' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart__box" ref={boxRef}>
        {loading && <div className="chart__overlay">Загружаем свечи…</div>}
      </div>

      {notes.length > 0 && (
        <ul className="chart__notes">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      <p className="card__note">
        Нижняя панель — расхождение close/close между ногами. В таблице спред считается
        по стакану (ask одной биржи против bid другой), поэтому числа не совпадают:
        свечи стакана не содержат. Смотрите на динамику, а не на точное значение.
      </p>
    </div>
  )
}
