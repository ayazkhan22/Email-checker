'use client';

import React, { useState, useEffect } from 'react';
import { Send, BarChart3, Users, Clock, AlertCircle, CheckCircle, Mail, Sheet } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalSent: 0, opened: 0, openRate: 0 });
  const [campaigns, setCampaigns] = useState([]);

  // Mode: 'quick' or 'campaign'
  const [mode, setMode] = useState<'quick' | 'campaign'>('quick');

  // Quick Send State
  const [quickTo, setQuickTo] = useState('');
  const [quickSubject, setQuickSubject] = useState('');
  const [quickBody, setQuickBody] = useState('');
  const [quickSending, setQuickSending] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [quickSuccess, setQuickSuccess] = useState('');

  // Campaign State
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [leads, setLeads] = useState<{email: string}[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const sendQuickEmail = async () => {
    setQuickError('');
    setQuickSuccess('');
    if (!quickTo || !quickSubject || !quickBody) {
      setQuickError('Please fill in all fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(quickTo.trim())) {
      setQuickError('Please enter a valid email address.');
      return;
    }
    setQuickSending(true);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: `Quick Send to ${quickTo.trim()}`,
          subject: quickSubject,
          body: quickBody,
          leads: [{ email: quickTo.trim() }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      setQuickSuccess(`Email sent to ${quickTo.trim()}! Tracking is active.`);
      fetchStats();
      setQuickTo('');
      setQuickSubject('');
      setQuickBody('');
    } catch (err: any) {
      setQuickError(err.message);
    } finally {
      setQuickSending(false);
    }
  };

  const fetchLeads = async () => {
    setError('');
    setSuccess('');
    if (!sheetUrl) {
      setError('Please enter a Google Sheet URL');
      return;
    }
    setLoadingLeads(true);
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch leads');
      setLeads(data.leads);
      setSuccess(`Successfully imported ${data.leads.length} leads.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingLeads(false);
    }
  };

  const sendCampaign = async () => {
    setError('');
    setSuccess('');
    if (!campaignName || !subject || !body || leads.length === 0) {
      setError('Please fill all fields and import leads first.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignName, subject, body, leads })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send campaign');
      setSuccess('Campaign sent successfully! Emails are now being tracked.');
      fetchStats();
      setCampaignName('');
      setSubject('');
      setBody('');
      setLeads([]);
      setSheetUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="header animate-in delay-1">
        <h1>Cold Email Tracker</h1>
        <p>Send and monitor your cold email campaigns with precision.</p>
      </header>

      {/* Stats Section */}
      <section className="stats-grid animate-in delay-2">
        <div className="stat-card">
          <div className="stat-title"><Send size={16} style={{display: 'inline', marginRight: '8px'}}/>Total Sent</div>
          <div className="stat-value">{stats.totalSent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title"><Users size={16} style={{display: 'inline', marginRight: '8px'}}/>Opened</div>
          <div className="stat-value success">{stats.opened}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title"><BarChart3 size={16} style={{display: 'inline', marginRight: '8px'}}/>Open Rate</div>
          <div className="stat-value">{stats.openRate}%</div>
        </div>
      </section>

      <div className="main-content animate-in delay-3">
        {/* Compose Panel */}
        <div className="panel">
          {/* Mode Tabs */}
          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === 'quick' ? 'active' : ''}`}
              onClick={() => { setMode('quick'); setQuickError(''); setQuickSuccess(''); }}
            >
              <Mail size={16} /> Quick Send
            </button>
            <button
              className={`mode-tab ${mode === 'campaign' ? 'active' : ''}`}
              onClick={() => { setMode('campaign'); setError(''); setSuccess(''); }}
            >
              <Sheet size={16} /> Campaign
            </button>
          </div>

          {/* Quick Send */}
          {mode === 'quick' && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Send a one-off tracked email directly to a single recipient.
              </p>

              {quickError && <div className="alert alert-error"><AlertCircle size={16}/> {quickError}</div>}
              {quickSuccess && <div className="alert alert-success"><CheckCircle size={16}/> {quickSuccess}</div>}

              <div className="form-group">
                <label className="form-label">Recipient Email</label>
                <input
                  id="quick-to"
                  type="email"
                  className="form-input"
                  placeholder="friend@example.com"
                  value={quickTo}
                  onChange={(e) => setQuickTo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  id="quick-subject"
                  type="text"
                  className="form-input"
                  placeholder="Hey, quick question..."
                  value={quickSubject}
                  onChange={(e) => setQuickSubject(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message (HTML supported)</label>
                <textarea
                  id="quick-body"
                  className="form-textarea"
                  placeholder="Hi there,&#10;&#10;I wanted to reach out..."
                  value={quickBody}
                  onChange={(e) => setQuickBody(e.target.value)}
                />
              </div>

              <button
                id="quick-send-btn"
                className="btn"
                style={{ width: '100%' }}
                onClick={sendQuickEmail}
                disabled={quickSending}
              >
                <Send size={16} />
                {quickSending ? 'Sending...' : 'Send & Track Email'}
              </button>
            </div>
          )}

          {/* Campaign Mode */}
          {mode === 'campaign' && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Import leads from a Google Sheet and send a tracked campaign to all of them.
              </p>

              {error && <div className="alert alert-error"><AlertCircle size={16}/> {error}</div>}
              {success && <div className="alert alert-success"><CheckCircle size={16}/> {success}</div>}

              <div className="form-group">
                <label className="form-label">Campaign Name</label>
                <input type="text" className="form-input" placeholder="e.g. July Follow Ups" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Email Subject</label>
                <input type="text" className="form-input" placeholder="Quick question about..." value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Google Sheet URL (Leads)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-input" placeholder="https://docs.google.com/spreadsheets/d/..." value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} />
                  <button className="btn btn-secondary" onClick={fetchLeads} disabled={loadingLeads}>
                    {loadingLeads ? 'Loading...' : 'Import'}
                  </button>
                </div>
                {leads.length > 0 && (
                  <div className="leads-preview">
                    <div style={{fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem'}}>Imported {leads.length} leads:</div>
                    {leads.slice(0, 3).map((lead, i) => (
                      <div key={i} className="lead-item">{lead.email}</div>
                    ))}
                    {leads.length > 3 && <div className="lead-item" style={{color: 'var(--text-muted)'}}>...and {leads.length - 3} more</div>}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email Body (HTML supported)</label>
                <textarea className="form-textarea" placeholder="Hello,&#10;&#10;I was wondering if..." value={body} onChange={(e) => setBody(e.target.value)} />
              </div>

              <button className="btn" style={{ width: '100%' }} onClick={sendCampaign} disabled={sending || leads.length === 0}>
                {sending ? 'Sending Campaign...' : `Send Campaign to ${leads.length} Leads`}
              </button>
            </div>
          )}
        </div>

        {/* History Panel */}
        <div className="panel">
          <h2><Clock size={20} /> Recent Campaigns</h2>
          <div className="history-list">
            {campaigns.length === 0 && (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>
                No emails sent yet. Send your first one!
              </div>
            )}
            {campaigns.map((camp: any) => (
              <div key={camp.id} className="history-item">
                <div className="history-info">
                  <h4>{camp.name}</h4>
                  <p>{new Date(camp.sentAt).toLocaleDateString()} · {camp.sentCount} sent, {camp.openedCount} opened</p>
                </div>
                <div className={`status-badge ${camp.openedCount > 0 ? 'status-opened' : 'status-sent'}`}>
                  {camp.openedCount > 0 ? 'Opened' : 'Sent'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

