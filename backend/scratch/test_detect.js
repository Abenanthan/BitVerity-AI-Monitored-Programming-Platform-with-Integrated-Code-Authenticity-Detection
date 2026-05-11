const axios = require('axios');
const crypto = require('crypto');

async function runTest() {
  // Use a user ID that has 5 samples (assuming the first one)
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const profile = await prisma.styleProfile.findFirst({ where: { sampleCount: { gte: 3 } } });
  
  if (!profile) {
    console.log("No profile with >= 3 samples.");
    return;
  }
  
  console.log("Testing with User ID:", profile.userId);
  
  try {
    const res = await axios.post('http://localhost:8000/detect/analyze', {
      submissionId: crypto.randomUUID(),
      userId: profile.userId,
      code: "def hello():\n    print('world')\n",
      language: "python",
      behaviorLog: []
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.error("Error:", e.response ? e.response.data : e.message);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
