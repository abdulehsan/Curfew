import React, { useEffect, useState } from 'react'
import type { DailyUsageRecord } from '@shared/types'
import { Calendar, BarChart3 } from 'lucide-react'

export const HistoryChart: React.FC = () => {
  const [history, setHistory] = useState<DailyUsageRecord[]>([])

  useEffect(() => {
    window.api.getHistory().then(setHistory).catch(console.error)
  }, [])

  // Generate last 7 days
  const last7Days: { dateStr: string; label: string; usageMs: number }[] = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })
    const record = history.find((h) => h.date === dateStr)
    last7Days.push({
      dateStr,
      label,
      usageMs: record ? record.totalUsageMs : 0
    })
  }

  const maxMs = Math.max(...last7Days.map((d) => d.usageMs), 60 * 60 * 1000) // at least 1h scale

  const formatHours = (ms: number): string => {
    const hours = (ms / (3600 * 1000)).toFixed(1)
    return `${hours}h`
  }

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--primary)" />
            Last 7 Days Usage
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Daily target game time history
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          <Calendar size={14} />
          <span>Last 7 Days</span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '12px',
          height: '160px',
          alignItems: 'flex-end',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        {last7Days.map((item) => {
          const heightPct = Math.min(100, Math.round((item.usageMs / maxMs) * 100))
          const isToday = item.dateStr === today.toISOString().split('T')[0]

          return (
            <div
              key={item.dateStr}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {formatHours(item.usageMs)}
              </span>

              <div
                style={{
                  width: '100%',
                  maxWidth: '36px',
                  height: `${Math.max(4, heightPct)}%`,
                  borderRadius: '6px',
                  background: isToday
                    ? 'linear-gradient(180deg, var(--primary), #e11d48)'
                    : 'linear-gradient(180deg, var(--accent), #4338ca)',
                  boxShadow: isToday ? '0 0 12px var(--primary-glow)' : 'none',
                  transition: 'height 0.4s ease'
                }}
                title={`${item.label}: ${formatHours(item.usageMs)}`}
              />

              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? 'var(--text-main)' : 'var(--text-dim)'
                }}
              >
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
