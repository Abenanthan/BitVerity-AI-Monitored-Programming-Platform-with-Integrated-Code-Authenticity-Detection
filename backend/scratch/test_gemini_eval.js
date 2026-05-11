const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGeminiEval() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API Key found:", !!apiKey);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
    { model: "gemini-2.5-flash" },
    { apiVersion: "v1beta" }
  );

  const language = "python";
  const code = `def twoSum(nums, target): return [0, 1]`;
  const answers = [
    { question: "Why return [0,1]?", answer: "Because it's a test." },
    { question: "What is this?", answer: "A test answer." },
    { question: "Time complexity?", answer: "O(1)" }
  ];

  const prompt = `You are an expert technical interviewer. The candidate submitted the following ${language} code:\n\n${code}\n\nI asked them these 3 extremely simple questions, and they provided these short answers under time pressure (20 seconds):\n${answers.map((a, i) => \`Q\${i + 1}: \${a.question}\nA\${i + 1}: \${a.answer || "[No Answer]"}\`).join('\n\n')}\n\nEvaluate the correctness and authenticity of these answers. Keep in mind they had very little time, so brief or slightly informal answers are acceptable if correct. Return ONLY a JSON object with a single field "suspicion_score" between 0.0 (perfectly correct, genuine) and 1.0 (completely wrong, evasive, or fake). Example: {"suspicion_score": 0.2}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    const text = await result.response.text();
    console.log("RAW RESPONSE:", text);
    const evalResult = JSON.parse(text);
    console.log("PARSED SCORE:", evalResult.suspicion_score);
    console.log("\n✅ Gemini EVAL is WORKING!");
  } catch (err) {
    console.error("❌ Gemini EVAL FAILED!");
    console.error(err);
  }
}

testGeminiEval();
