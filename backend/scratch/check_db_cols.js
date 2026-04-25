const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const columns = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'detection_reports'
  `);
  console.log('Columns in detection_reports:', JSON.stringify(columns, null, 2));
  
  const sample = await prisma.detectionReport.findFirst();
  console.log('Sample report:', JSON.stringify(sample, null, 2));
  
  process.exit(0);
}

check();
