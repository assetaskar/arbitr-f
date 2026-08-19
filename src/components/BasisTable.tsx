import type { BasisOpportunity } from '../types'
import { fmtPrice, spreadClass } from '../format'

interface Props {
  rows: BasisOpportunity[]
  names: Record<string, string>
}

export function BasisTable({ rows, names }: Props) {
  const name = (id: string) => names[id] ?? id

  return (
    <section className="card">
      <div className="card__head">
        <h3>Базис спот↔фьючерс (внутри биржи)</h3>
        <span className="badge">{rows.length}</span>
      </div>

      {rows.length === 0 ? (
        <p className="empty">
          Нет заметного базиса. Нужны биржи со спотом и перпом по одной паре.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Пара</th>
                <th>Биржа</th>
                <th className="num">Спот</th>
                <th className="num">Фьючерс</th>
                <th className="num">Базис</th>
                <th>Схема</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const premium = o.direction === 'perp_premium'
                return (
                  <tr key={`${o.symbol}-${o.exchange}`}>
                    <td className="mono strong">{o.symbol}</td>
                    <td><span className="tag tag--neutral">{name(o.exchange)}</span></td>
                    <td className="num mono">{fmtPrice(o.spot_price)}</td>
                    <td className="num mono">{fmtPrice(o.perp_price)}</td>
                    <td className={`num mono strong ${spreadClass(Math.abs(o.basis_pct))}`}>
                      {o.basis_pct > 0 ? '+' : ''}
                      {o.basis_pct.toFixed(3)}%
                    </td>
                    <td className="basis-scheme">
                      {premium ? 'лонг спот · шорт фьюч' : 'шорт спот · лонг фьюч'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="card__note">
        Базис = (фьючерс − спот) / спот. «Фьючерс дороже» — продать перп и купить спот;
        «фьючерс дешевле» — наоборот. Сделка на одной бирже, без перевода между площадками.
      </p>
    </section>
  )
}
