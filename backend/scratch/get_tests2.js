const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.problem.findUnique({
  where: {slug: 'longest-substring-without-repeating-characters'}, 
  include: {testCases: true}
}).then(p => {
  console.log(JSON.stringify(p.testCases, null, 2));
}).finally(() => prisma.$disconnect());
