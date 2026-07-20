import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('docs.google.com/spreadsheets')) {
      return NextResponse.json({ error: 'Invalid Google Sheets URL' }, { status: 400 });
    }

    // Extract the Sheet ID
    const match = url.match(/\/d\/(.*?)\//);
    if (!match || !match[1]) {
      return NextResponse.json({ error: 'Could not extract Sheet ID' }, { status: 400 });
    }
    
    const sheetId = match[1];
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    const response = await fetch(exportUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch sheet. Make sure it is set to "Anyone with the link can view".' }, { status: 400 });
    }

    const csvText = await response.text();
    const rows = csvText.split('\n').map(r => r.trim()).filter(r => r);
    
    if (rows.length < 2) {
      return NextResponse.json({ error: 'Sheet is empty or missing headers.' }, { status: 400 });
    }

    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    const emailIndex = headers.findIndex(h => h.includes('email'));

    if (emailIndex === -1) {
      return NextResponse.json({ error: 'Could not find a column named "Email".' }, { status: 400 });
    }

    const leads = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',').map(c => c.trim());
      const email = cols[emailIndex];
      if (email) {
        leads.push({ email });
      }
    }

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    return NextResponse.json({ error: 'Failed to process Google Sheet' }, { status: 500 });
  }
}
