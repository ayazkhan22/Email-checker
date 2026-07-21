'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Email {
  id: string
  senderName: string
  recipientName: string
  recipientEmail: string
  subject: string
  body: string
  status: 'SENT' | 'OPENED'
  sentAt: string
  openedAt: string | null
}

function StatusBadge({ status, openedAt }: { status: string; openedAt: string | null }) {
  if (status === 'OPENED') {
    return (
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30 badge-opened w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Opened by: {status === 'OPENED' ? '' : ''}Aqib
        </span>
        {openedAt && (
          <span className="text-xs text-gray-500">
            {new Date(openedAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        )}
      </div>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-700/50 text-gray-400 border border-gray-600/30 w-fit">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
      Sent
    </span>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`glass-card p-5 flex items-center gap-4 fade-in`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchEmails = useCallback(async () => {
    try {
      const res = await fetch('/api/emails')
      const data = await res.json()
      setEmails(data.emails || [])
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to fetch emails', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmails()
    // Auto-refresh every 10 seconds to catch new opens
    const interval = setInterval(fetchEmails, 10000)
    return () => clearInterval(interval)
  }, [fetchEmails])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/seed')
      if (res.ok) {
        await fetchEmails()
      }
    } finally {
      setSeeding(false)
    }
  }

  const totalSent = emails.length
  const totalOpened = emails.filter(e => e.status === 'OPENED').length
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white">Email Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Track opens in real-time ·{' '}
            <span className="text-gray-500 text-sm">
              Last refreshed {lastRefresh.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            {seeding ? 'Seeding...' : '🌱 Load Demo Data'}
          </button>
          <Link
            href="/compose"
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Compose Email
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Emails Sent"
          value={totalSent}
          color="bg-indigo-500/20"
          icon={
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          }
        />
        <StatCard
          label="Emails Opened"
          value={totalOpened}
          color="bg-green-500/20"
          icon={
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          }
        />
        <StatCard
          label="Open Rate"
          value={`${openRate}%`}
          color="bg-purple-500/20"
          icon={
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Email Table */}
      <div className="glass-card overflow-hidden fade-in fade-in-delay-1">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h2 className="text-lg font-semibold text-white">Sent Emails</h2>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="shimmer h-16 rounded-lg" />
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-400 font-medium">No emails yet</p>
            <p className="text-gray-600 text-sm mt-1">
              Click &quot;Load Demo Data&quot; above or{' '}
              <Link href="/compose" className="text-indigo-400 hover:text-indigo-300">compose your first email</Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Recipient</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Sent At</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {emails.map((email) => (
                  <tr key={email.id} className="email-row">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          Sent to: {email.recipientName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{email.recipientEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300 max-w-xs truncate">{email.subject}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-400">
                        {new Date(email.sentAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={email.status} openedAt={email.openedAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-refresh note */}
      <p className="text-center text-xs text-gray-600">
        Dashboard auto-refreshes every 10 seconds to detect new email opens
      </p>
    </div>
  )
}
