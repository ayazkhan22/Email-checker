'use client';

import React, { useState, useEffect } from 'react';
import { Send, BarChart3, Users, Clock, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalSent: 0, opened: 0, openRate: 0 });
  const [campaigns, setCampaigns] = useState([]);
  
  // Form State
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [leads, setLeads] = useState<{email: string}[]>([]);
  
  // Status State
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
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch leads');
      }
      
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
        body: JSON.stringify({
          campaignName,
          subject,
          body,
          leads
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send campaign');
      }
      
      setSuccess('Campaign sent successfully! Emails are now being tracked.');
      fetchStats();
      // Reset form
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
        {/* Compose Campaign Panel */}
        <div className="panel">
          <h2><Send size={20} /> Compose Campaign</h2>
          
          {error && <div style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={16}/> {error}</div>}
          {success && <div style={{ color: '#10b981', marginBottom: '1rem' }}>{success}</div>}

          <div className="form-group">
            <label className="form-label">Campaign Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. July Follow Ups"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Subject</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Quick question about..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Google Sheet URL (Leads)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
              <button 
                className="btn btn-secondary" 
                onClick={fetchLeads}
                disabled={loadingLeads}
              >
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
            <textarea 
              className="form-textarea" 
              placeholder="Hello,\n\nI was wondering if..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            ></textarea>
          </div>

          <button 
            className="btn" 
            style={{ width: '100%' }}
            onClick={sendCampaign}
            disabled={sending || leads.length === 0}
          >
            {sending ? 'Sending Campaign...' : `Send Campaign to ${leads.length} Leads`}
          </button>
        </div>

        {/* History Panel */}
        <div className="panel">
          <h2><Clock size={20} /> Recent Campaigns</h2>
          <div className="history-list">
            {campaigns.map((camp: any) => (
              <div key={camp.id} className="history-item">
                <div className="history-info">
                  <h4>{camp.name}</h4>
                  <p>{new Date(camp.sentAt).toLocaleDateString()}</p>
                </div>
                <div className="status-badge status-sent">
                  {camp.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
