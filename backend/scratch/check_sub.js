const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const subId = 'e6b2d15f-e683-4e0f-949e-742df0cfee42';
  const sub = await prisma.submission.findUnique({
    where: { id: subId },
    include: { detectionReport: true }
  });
  console.log('Submission:', JSON.stringify(sub, null, 2));
  process.exit(0);
}

check();
