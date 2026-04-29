const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function testDetection() {
  try {
    // 1. Login to get a token
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: "admin@codeverify.dev",
      password: "Admin@1234",
    });
    const token = loginRes.data.data.accessToken;
    console.log("✅ Logged in successfully");

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Fetch the "Two Sum" problem ID
    const problemRes = await axios.get(`${API_URL}/problems/two-sum`);
    const problemId = problemRes.data.data.id;
    console.log(`✅ Fetched problem ID: ${problemId}`);

    // 3. Test 1: AI-Generated Submission (Copy-Pasted)
    console.log("\n🧪 Test 1: Simulating AI-Generated Submission (Copy-Paste)...");
    const aiCode = `def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        if target - num in seen:
            return [seen[target - num], i]
        seen[num] = i
    return []`;

    const aiSubmitRes = await axios.post(
      `${API_URL}/submissions`,
      {
        problemId,
        code: aiCode,
        language: "python",
        behaviorLog: [
          { type: "paste", length: aiCode.length, t: Date.now() }, // Instant paste
        ],
      },
      { headers }
    );
    const aiSubId = aiSubmitRes.data.data.id;
    console.log(`✅ Submitted AI code. ID: ${aiSubId}`);

    // Wait a bit for async detection
    await new Promise((r) => setTimeout(r, 4000));

    const aiResult = await axios.get(`${API_URL}/submissions/${aiSubId}`, { headers });
    console.log(`🤖 AI Verdict: ${aiResult.data.data.aiVerdict} (Score: ${aiResult.data.data.aiScore})`);

    // 4. Test 2: Human-Written Submission (Typed)
    console.log("\n🧪 Test 2: Simulating Human-Written Submission (Typed slowly)...");
    const humanCode = `def twoSum(nums, target):
    # This is a comment
    for i in range(len(nums)):
        for j in range(i+1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]`;

    // Generate realistic keystrokes
    const behaviorLog = [];
    let t = Date.now();
    for (let i = 0; i < humanCode.length; i++) {
      behaviorLog.push({ type: "keypress", key: humanCode[i], t: t });
      t += Math.floor(Math.random() * 150) + 50; // 50-200ms per keystroke
    }

    const humanSubmitRes = await axios.post(
      `${API_URL}/submissions`,
      {
        problemId,
        code: humanCode,
        language: "python",
        behaviorLog,
      },
      { headers }
    );
    const humanSubId = humanSubmitRes.data.data.id;
    console.log(`✅ Submitted Human code. ID: ${humanSubId}`);

    // Wait a bit for async detection
    await new Promise((r) => setTimeout(r, 4000));

    const humanResult = await axios.get(`${API_URL}/submissions/${humanSubId}`, { headers });
    console.log(`🧑 Human Verdict: ${humanResult.data.data.aiVerdict} (Score: ${humanResult.data.data.aiScore})`);

  } catch (err) {
    console.error("❌ Test failed:", err.response ? err.response.data : err.message);
  }
}

testDetection();
