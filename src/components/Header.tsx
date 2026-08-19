import type { ConnState } from '../useLiveData'

interface Props {
  conn: ConnState
  updatedAt: number | null
  scanning: boolean
  universeSize: number
  dataAgeSec: number
  onRefresh: () => void
  onOpenSettings: () => void
}

const CONN_LABEL: Record<ConnState, string> = {
  connecting: 'подключение…',
  online: 'в сети',
  offline: 'нет связи',
}

function formatTime(ts: number | null): string {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleTimeString('ru-RU')
}

export function Header({
  conn,
  updatedAt,
  scanning,
  universeSize,
  dataAgeSec,
  onRefresh,
  onOpenSettings,
}: Props) {
  return (
    <header className="header">
      <div className="header__title">
        <span className="header__logo">◆</span>
        <div>
          <h1>Арбитраж-сканер</h1>
          <p className="header__sub">межбиржевые расхождения и funding на крипте</p>
        </div>
      </div>

      <div className="header__status">
        <span className={`dot dot--${conn}`} />
        <span className="header__conn">{CONN_LABEL[conn]}</span>
        <span className="header__sep">·</span>
        <span className="header__updated">
          обновлено: {formatTime(updatedAt)}
          {universeSize > 0 && <span className="header__sep"> · </span>}
          {universeSize > 0 && <span>{universeSize} пар</span>}
          {dataAgeSec >= 1 && <span className="header__sep"> · данные {Math.round(dataAgeSec)} с</span>}
          {scanning && <span className="header__scan"> · скан…</span>}
        </span>
        <button className="btn btn--ghost" onClick={onRefresh} title="Обновить сейчас">
          ⟳ Обновить
        </button>
        <button
          className="btn btn--ghost btn--icon"
          onClick={onOpenSettings}
          aria-label="Настройки"
          title="Настройки"
        >
          ⚙
        </button>
      </div>
    </header>
  )
}
