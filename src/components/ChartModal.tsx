// Модалка с графиком: оверлей + закрытие по Esc и клику по фону. Сам график — в PriceChart.
import { useEffect } from 'react'
import type { ChartTarget } from '../types'
import { PriceChart } from './PriceChart'

interface Props {
  target: ChartTarget | null
  names: Record<string, string>
  onClose: () => void
}

export function ChartModal({ target, names, onClose }: Props) {
  useEffect(() => {
    if (!target) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [target, onClose])

  if (!target) return null

  return (
    <div
      className="modal-overlay"
      // Закрываем по mousedown и только если нажали именно по фону: на графике мышь
      // таскают постоянно, и клик-по-отпусканию захлопывал бы модалку при работе
      // с крестокурсором.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={`График ${target.symbol}`}>
        <div className="modal__head">
          <h2 className="modal__title mono">{target.symbol}</h2>
          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label="Закрыть"
            title="Закрыть"
          >
            ✕
          </button>
        </div>
        <PriceChart target={target} names={names} />
      </div>
    </div>
  )
}
