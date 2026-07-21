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
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Compose Form State
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)
  const [form, setForm] = useState({
    recipientName: '',
    recipientEmail: '',
    subject: '',
    emailBody: '',
  })

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



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setFormError('')
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    setFormSuccess(false)

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error || 'Failed to send email')
        return
      }

      setFormSuccess(true)
      setForm({
        recipientName: '',
        recipientEmail: '',
        subject: '',
        emailBody: '',
      })
      await fetchEmails()
      
      setTimeout(() => {
        setFormSuccess(false)
      }, 3000)
    } catch {
      setFormError('Network error — please try again')
    } finally {
      setFormLoading(false)
    }
  }

  const totalSent = emails.length
  const totalOpened = emails.filter(e => e.status === 'OPENED').length
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white">Email Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Track opens in real-time ·{' '}
            <span className="text-gray-500 text-sm" suppressHydrationWarning>
              Last refreshed {lastRefresh.toLocaleTimeString('en-US')}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">

          <button
            onClick={() => document.getElementById('compose-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Compose Email
          </button>
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
              Scroll down to compose your first email
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

      {/* Compose Email Section */}
      <div id="compose-section" className="pt-8 fade-in fade-in-delay-2 scroll-mt-24">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Compose Email</h2>
          <p className="text-gray-400 mt-1">Send a tracked email directly from your dashboard</p>
        </div>

        <div className="glass-card p-6">
          {formSuccess && (
            <div className="mb-6 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between fade-in">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-green-400">Email sent successfully! The table above has been updated.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSendEmail} className="space-y-5">
            {/* Recipient Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="recipientName" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Recipient Name
                </label>
                <input
                  id="recipientName"
                  name="recipientName"
                  type="text"
                  value={form.recipientName}
                  onChange={handleChange}
                  required
                  className="input-field w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm transition-all duration-200"
                  placeholder="e.g. Aqib"
                />
              </div>
              <div>
                <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Recipient Email
                </label>
                <input
                  id="recipientEmail"
                  name="recipientEmail"
                  type="email"
                  value={form.recipientEmail}
                  onChange={handleChange}
                  required
                  className="input-field w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm transition-all duration-200"
                  placeholder="aqib@example.com"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1.5">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                required
                className="input-field w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm transition-all duration-200"
                placeholder="What's this email about?"
              />
            </div>

            {/* Body */}
            <div>
              <label htmlFor="emailBody" className="block text-sm font-medium text-gray-300 mb-1.5">
                Message Body
              </label>
              <textarea
                id="emailBody"
                name="emailBody"
                value={form.emailBody}
                onChange={handleChange}
                required
                rows={6}
                className="input-field w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm transition-all duration-200 resize-none"
                placeholder={`Hi Aqib,\n\nWrite your message here...\n\nBest,\nAyaz`}
              />
            </div>

            {/* Tracking note */}
            <div className="flex items-start gap-2.5 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <svg className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-indigo-300">
                A 1×1 invisible tracking pixel will be automatically added to this email.
                When the recipient opens it, the dashboard will update to{' '}
                <strong className="text-indigo-200">Opened</strong>.
              </p>
            </div>

            {/* Error */}
            {formError && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg fade-in">
                <p className="text-sm text-red-400">{formError}</p>
              </div>
            )}

            {/* Submit */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={formLoading}
                className="w-full sm:w-auto py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {formLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Tracked Email
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
