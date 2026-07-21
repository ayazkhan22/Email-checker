'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ComposePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    recipientName: '',
    recipientEmail: '',
    subject: '',
    emailBody: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send email')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-in">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-white">Compose Email</h1>
        </div>
        <p className="text-gray-400 ml-8">A tracking pixel will be automatically embedded</p>
      </div>

      {/* Form */}
      <div className="glass-card p-6 fade-in fade-in-delay-1">
        {success ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-white">Email Sent!</p>
            <p className="text-gray-400 text-sm">Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">


            {/* Recipient Name + Email */}
            <div className="grid grid-cols-2 gap-4">
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
                rows={8}
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
                <strong className="text-indigo-200">Opened</strong> with an exact timestamp.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
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
                  Send Email
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
