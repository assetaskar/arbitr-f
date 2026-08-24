import { useEffect, useMemo, useState } from 'react'
import {
  fetchDefaultSettings,
  fetchExchanges,
  loadStoredSettings,
  storeSettings,
} from './api'
import { useLiveData } from './useLiveData'
import type { ChartTarget, ExchangeInfo, Settings } from './types'
import { Header } from './components/Header'
import { SettingsDrawer } from './components/SettingsDrawer'
import { ChartModal } from './components/ChartModal'
import { CrossExchangeTable } from './components/CrossExchangeTable'
import { BasisTable } from './components/BasisTable'
import { FundingTable } from './components/FundingTable'

export default function App() {
  const [exchanges, setExchanges] = useState<ExchangeInfo[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // null = закрыто; отдельного флага не нужно.
  const [chartTarget, setChartTarget] = useState<ChartTarget | null>(null)
  const { snapshot, conn, refresh } = useLiveData(settings)

  // Список бирж — с сервера; настройки — свои для этого браузера,
  // серверные дефолты нужны лишь при первом запуске и для новых полей.
  useEffect(() => {
    Promise.all([fetchExchanges(), fetchDefaultSettings()])
      .then(([ex, defaults]) => {
        setExchanges(ex)
        setSettings({ ...defaults, ...(loadStoredSettings() ?? {}) })
      })
      .catch((e) => setLoadError(String(e.message ?? e)))
  }, [])

  const names = useMemo(() => {
    const m: Record<string, string> = {}
    for (const e of exchanges) m[e.id] = e.name
    return m
  }, [exchanges])

  // Настройки никуда не отправляются «на сохранение»: они уходят в наш WebSocket
  // и влияют только на эту вкладку.
  const handleSave = (s: Settings) => {
    setSettings(s)
    storeSettings(s)
  }

  const errorEntries = Object.entries(snapshot?.errors ?? {})

  return (
    <div className="app">
      <Header
        conn={conn}
        updatedAt={snapshot?.updated_at ?? null}
        scanning={snapshot?.scanning ?? false}
        universeSize={snapshot?.universe_size ?? 0}
        dataAgeSec={snapshot?.data_age_sec ?? 0}
        onRefresh={refresh}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {loadError && <div className="banner banner--error">Ошибка: {loadError}</div>}

      {settings && (
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          exchanges={exchanges}
          universeSize={snapshot?.universe_size ?? 0}
          onSave={handleSave}
        />
      )}

      <ChartModal
        target={chartTarget}
        names={names}
        onClose={() => setChartTarget(null)}
      />

      <div className="layout">
        <main className="content">
          {!snapshot && !loadError && (
            <div className="banner">Подключаемся к сканеру и ждём первый снимок…</div>
          )}

          {settings?.track_spot && snapshot && (
            <CrossExchangeTable
              title="Межбиржевой спот"
              rows={snapshot.spot}
              names={names}
              emptyHint="Нет расхождений выше порога. Понизьте «мин. спред» или добавьте бирж."
              market="spot"
              onRowClick={setChartTarget}
            />
          )}

          {settings?.track_perp && snapshot && (
            <CrossExchangeTable
              title="Межбиржевой фьючерс (перпы)"
              rows={snapshot.perp}
              names={names}
              emptyHint="Нет расхождений по фьючерсам выше порога."
              market="swap"
              onRowClick={setChartTarget}
            />
          )}

          {settings?.track_basis && snapshot && (
            <BasisTable rows={snapshot.basis} names={names} onRowClick={setChartTarget} />
          )}

          {settings?.track_funding && snapshot && (
            <FundingTable rows={snapshot.funding} names={names} onRowClick={setChartTarget} />
          )}

          {errorEntries.length > 0 && (
            <section className="card card--muted">
              <div className="card__head">
                <h3>Недоступные биржи / ошибки</h3>
                <span className="badge badge--warn">{errorEntries.length}</span>
              </div>
              <ul className="errors">
                {errorEntries.map(([k, v]) => (
                  <li key={k}>
                    <span className="mono strong">{k}</span>
                    <span className="errors__msg">{v}</span>
                  </li>
                ))}
              </ul>
              <p className="card__note">
                Часть бирж может быть недоступна из вашего региона или временно не отвечает —
                это не мешает остальным.
              </p>
            </section>
          )}
        </main>
      </div>

      <footer className="footer">
        Данные — публичные API бирж через ccxt. Не является инвестиционной рекомендацией.
      </footer>
    </div>
  )
}
