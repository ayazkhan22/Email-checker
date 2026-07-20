import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignName, subject, body: emailBody, leads } = body;

    if (!campaignName || !subject || !emailBody || !leads || !leads.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { SMTP_EMAIL, SMTP_PASSWORD, NEXT_PUBLIC_APP_URL } = process.env;

    if (!SMTP_EMAIL || !SMTP_PASSWORD || !NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: 'Server SMTP configuration is missing' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
      },
    });

    // Create the campaign in DB
    const campaign = await prisma.campaign.create({
      data: { name: campaignName },
    });

    const results = [];

    // Process emails
    for (const lead of leads) {
      // Create email record first to get the ID for tracking
      const emailRecord = await prisma.email.create({
        data: {
          campaignId: campaign.id,
          recipientEmail: lead.email,
          subject: subject,
          body: emailBody,
          status: 'SENT'
        }
      });

      const trackingUrl = `${NEXT_PUBLIC_APP_URL}/api/track/${emailRecord.id}`;
      const trackingPixelHtml = `<img src="${trackingUrl}" alt="" width="1" height="1" style="display:none;" />`;
      const htmlBody = `<div>${emailBody}</div>${trackingPixelHtml}`;

      try {
        await transporter.sendMail({
          from: SMTP_EMAIL,
          to: lead.email,
          subject: subject,
          html: htmlBody,
        });
        results.push({ email: lead.email, status: 'success' });
      } catch (err) {
        console.error(`Failed to send email to ${lead.email}:`, err);
        results.push({ email: lead.email, status: 'error', error: String(err) });
        // Update DB if failed
        await prisma.email.update({
          where: { id: emailRecord.id },
          data: { status: 'FAILED' }
        });
      }
    }

    return NextResponse.json({ success: true, campaign, results });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 });
  }
}
