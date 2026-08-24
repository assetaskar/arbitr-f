import type { ChartTarget, CrossOpportunity, MarketType } from '../types'
import { fmtPct, fmtPrice, spreadClass } from '../format'

interface Props {
  title: string
  rows: CrossOpportunity[]
  names: Record<string, string>
  emptyHint: string
  // Компонент рендерится дважды (спот и перп) и сам различить их не может.
  market: MarketType
  onRowClick?: (target: ChartTarget) => void
}

// Универсальная таблица межбиржевого расхождения (спот или фьючерс).
export function CrossExchangeTable({
  title,
  rows,
  names,
  emptyHint,
  market,
  onRowClick,
}: Props) {
  const name = (id: string) => names[id] ?? id

  return (
    <section className="card">
      <div className="card__head">
        <h3>{title}</h3>
        <span className="badge">{rows.length}</span>
      </div>

      {rows.length === 0 ? (
        <p className="empty">{emptyHint}</p>
      ) : (
        <div className="table-wrap">
          <table className={`table ${onRowClick ? 'table--clickable' : ''}`}>
            <thead>
              <tr>
                <th>Пара</th>
                <th>Купить</th>
                <th className="num">Цена покупки</th>
                <th>Продать</th>
                <th className="num">Цена продажи</th>
                <th className="num">Спред</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr
                  key={`${o.symbol}-${o.buy_exchange}-${o.sell_exchange}`}
                  onClick={() =>
                    onRowClick?.({
                      symbol: o.symbol,
                      a: { exchange: o.buy_exchange, market },
                      b: { exchange: o.sell_exchange, market },
                    })
                  }
                >
                  <td className="mono strong">
                    {/* Обработчик кнопке не нужен: Enter и Space порождают click,
                        который всплывает до строки. Клавиатура работает без
                        role="button" на <tr>, ломающего семантику таблицы. */}
                    <button type="button" className="cell-link">
                      {o.symbol}
                    </button>
                  </td>
                  <td><span className="tag tag--buy">{name(o.buy_exchange)}</span></td>
                  <td className="num mono">{fmtPrice(o.buy_price)}</td>
                  <td><span className="tag tag--sell">{name(o.sell_exchange)}</span></td>
                  <td className="num mono">{fmtPrice(o.sell_price)}</td>
                  <td className={`num mono strong ${spreadClass(o.spread_pct)}`}>
                    {fmtPct(o.spread_pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
