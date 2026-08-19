// Форматирование чисел для таблиц.

// Цена: адаптивное число знаков (дорогие активы — меньше, дешёвые — больше).
export function fmtPrice(v: number): string {
  const abs = Math.abs(v)
  let digits = 2
  if (abs < 0.01) digits = 8
  else if (abs < 1) digits = 6
  else if (abs < 100) digits = 4
  return v.toLocaleString('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function fmtPct(v: number, digits = 2): string {
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(digits)}%`
}

// Класс интенсивности для подсветки спреда.
export function spreadClass(pct: number): string {
  if (pct >= 2) return 'spread--hot'
  if (pct >= 1) return 'spread--high'
  if (pct >= 0.3) return 'spread--mid'
  return 'spread--low'
}
