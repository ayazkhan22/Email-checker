import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        emails: true
      }
    });

    const totalSent = await prisma.email.count({
      where: { status: { in: ['SENT', 'OPENED'] } }
    });

    const opened = await prisma.email.count({
      where: { status: 'OPENED' }
    });

    const openRate = totalSent > 0 ? ((opened / totalSent) * 100).toFixed(1) : 0;

    const formattedCampaigns = campaigns.map(camp => {
      const sentCount = camp.emails.length;
      const openedCount = camp.emails.filter(e => e.status === 'OPENED').length;
      return {
        id: camp.id,
        name: camp.name,
        sentAt: camp.createdAt,
        status: 'COMPLETED', // Simplified status for UI
        sentCount,
        openedCount
      };
    });

    return NextResponse.json({
      stats: {
        totalSent,
        opened,
        openRate
      },
      campaigns: formattedCampaigns
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
