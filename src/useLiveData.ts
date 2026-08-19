// WebSocket-сессия: отправляем СВОИ настройки, получаем СВОИ снимки.
// Настройки этой вкладки не влияют на другие — общий у клиентов только кэш бирж.
import { useCallback, useEffect, useRef, useState } from 'react'
import { wsUrl } from './api'
import type { Settings, Snapshot } from './types'

export type ConnState = 'connecting' | 'online' | 'offline'

export function useLiveData(settings: Settings | null) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [conn, setConn] = useState<ConnState>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Держим актуальные настройки под рукой, чтобы отправить их сразу после connect.
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const send = useCallback(() => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN && settingsRef.current) {
      ws.send(JSON.stringify(settingsRef.current))
    }
  }, [])

  useEffect(() => {
    let closedByUs = false

    const connect = () => {
      setConn('connecting')
      const ws = new WebSocket(wsUrl())
      wsRef.current = ws

      ws.onopen = () => {
        setConn('online')
        send()
      }
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (data?.error) return
          setSnapshot(data as Snapshot)
        } catch {
          /* игнорируем битые сообщения */
        }
      }
      ws.onclose = () => {
        setConn('offline')
        if (!closedByUs) retryRef.current = setTimeout(connect, 3000)
      }
      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      closedByUs = true
      if (retryRef.current) clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [send])

  // Любое изменение настроек уходит на сервер — он пересчитывает немедленно.
  useEffect(() => {
    if (settings) send()
  }, [settings, send])

  return { snapshot, conn, refresh: send }
}
