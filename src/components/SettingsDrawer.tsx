import { useEffect } from 'react'
import type { ExchangeInfo, Settings } from '../types'
import { SettingsPanel } from './SettingsPanel'

interface Props {
  open: boolean
  onClose: () => void
  settings: Settings
  exchanges: ExchangeInfo[]
  universeSize: number
  onSave: (s: Settings) => void
}

// Выезжающая справа панель настроек: оверлей + сама панель + закрытие по Esc.
export function SettingsDrawer({ open, onClose, ...panelProps }: Props) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // Пока drawer открыт, фон не скроллится.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Настройки"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer__head">
          <h2 className="drawer__title">Настройки</h2>
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
        <SettingsPanel {...panelProps} />
      </div>
    </div>
  )
}
