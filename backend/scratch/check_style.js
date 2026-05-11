const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.styleProfile.findMany().then(r => console.log("Profiles:", r.map(x => ({ id: x.id, sampleCount: x.sampleCount, vectorLen: x.embeddingVector ? x.embeddingVector.length : 0 })))).finally(() => prisma.$disconnect());
