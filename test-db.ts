import { prisma } from './src/lib/prisma';
prisma.campaign.findMany().then(res => console.log('SUCCESS', res)).catch(e => {
  console.error('QUERY ERROR', e);
  console.error(e.stack);
});
