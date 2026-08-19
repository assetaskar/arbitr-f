import type { FundingOpportunity } from '../types'
import { fmtPct, spreadClass } from '../format'

interface Props {
  rows: FundingOpportunity[]
  names: Record<string, string>
}

export function FundingTable({ rows, names }: Props) {
  const name = (id: string) => names[id] ?? id

  return (
    <section className="card">
      <div className="card__head">
        <h3>Funding-спред (бессрочные фьючерсы)</h3>
        <span className="badge">{rows.length}</span>
      </div>

      {rows.length === 0 ? (
        <p className="empty">
          Нет данных по funding. Проверьте, что выбранные биржи поддерживают фьючерсы.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Пара</th>
                <th>Лонг (ставка ↓)</th>
                <th className="num">Ставка</th>
                <th>Шорт (ставка ↑)</th>
                <th className="num">Ставка</th>
                <th className="num">Спред APR</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.symbol}>
                  <td className="mono strong">{o.symbol}</td>
                  <td><span className="tag tag--buy">{name(o.long_exchange)}</span></td>
                  <td className="num mono">{fmtPct(o.long_rate, 4)}</td>
                  <td><span className="tag tag--sell">{name(o.short_exchange)}</span></td>
                  <td className="num mono">{fmtPct(o.short_rate, 4)}</td>
                  <td className={`num mono strong ${spreadClass(o.spread_apr / 8)}`}>
                    {fmtPct(o.spread_apr, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="card__note">
        Ставка — за интервал финансирования (обычно 8 ч). APR — грубая годовая оценка
        (×3×365). Стратегия: лонг там, где ставка ниже, шорт там, где выше.
      </p>
    </section>
  )
}
