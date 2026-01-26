require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const polls = await prisma.poll.findMany({
      orderBy: { id: 'asc' },
      include: {
        PollOption: {
          include: { PollVote: { include: { Member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } } } },
          orderBy: { order: 'asc' }
        }
      },
      take: 100,
    });

    console.log(`Found ${polls.length} polls`);
    for (const p of polls) {
      const totalVotes = p.PollOption.flatMap(o => (o.PollVote || []).map(v => v.memberId)).filter(Boolean);
      const unique = new Set(totalVotes);
      console.log(`Poll ${p.id}: ${p.question} - options=${p.PollOption.length} votes=${unique.size}`);
      for (const opt of p.PollOption) {
        console.log(`  Option ${opt.id}: ${opt.text} votes=${(opt.PollVote||[]).length}`);
        if (opt.PollVote && opt.PollVote.length > 0) {
          for (const v of opt.PollVote) {
            console.log(`    Voter: ${v.memberId} -> ${v.Member?.firstName || '-'} ${v.Member?.lastName || '-'} `);
          }
        }
      }
    }

    process.exit(0);
  } catch (e) {
    console.error('Error querying polls:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
