import React, { useEffect, useState } from 'react'
import type { DailyUsageRecord } from '@shared/types'
import { Calendar, BarChart3, TrendingUp, Award, Clock } from 'lucide-react'

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

  const totalWeeklyMs = last7Days.reduce((acc, curr) => acc + curr.usageMs, 0)
  const averageDailyMs = Math.round(totalWeeklyMs / 7)
  const maxMs = Math.max(...last7Days.map((d) => d.usageMs), 60 * 60 * 1000) // at least 1h scale

  const formatHours = (ms: number): string => {
    const hours = (ms / (3600 * 1000)).toFixed(1)
    return `${hours}h`
  }

  const formatMins = (ms: number): string => {
    const totalMinutes = Math.round(ms / 60000)
    if (totalMinutes < 60) return `${totalMinutes}m`
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <Clock size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>7-Day Total</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
            {formatMins(totalWeeklyMs)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Tracked application playtime</p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <TrendingUp size={16} color="var(--accent)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Daily Average</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
            {formatMins(averageDailyMs)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Across past 7 days</p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <Award size={16} color="var(--success)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Discipline Status</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            Active Habit
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>Zero ungraceful interruptions</p>
        </div>
      </div>

      {/* Bar Chart Card */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="var(--primary)" />
              Daily Usage Distribution
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Visual breakdown of time spent on designated games and distraction targets.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <Calendar size={14} />
            <span>Rolling 7-Day Window</span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '14px',
            height: '200px',
            alignItems: 'flex-end',
            paddingBottom: '20px',
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
                  gap: '10px'
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: isToday ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: 600
                  }}
                >
                  {formatHours(item.usageMs)}
                </span>

                <div
                  style={{
                    width: '100%',
                    maxWidth: '42px',
                    height: `${Math.max(6, heightPct)}%`,
                    borderRadius: '8px 8px 4px 4px',
                    background: isToday
                      ? 'linear-gradient(180deg, var(--primary), #e11d48)'
                      : item.usageMs > 0
                        ? 'linear-gradient(180deg, var(--accent), #4338ca)'
                        : 'rgba(255, 255, 255, 0.05)',
                    boxShadow: isToday ? '0 0 16px var(--primary-glow)' : 'none',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
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
    </div>
  )
}
