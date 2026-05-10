const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.submission.findFirst({
  orderBy: { createdAt: 'desc' },
  include: { problem: true }
}).then(sub => console.dir(sub, { depth: null })).finally(() => prisma.$disconnect());
